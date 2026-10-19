/**
 * Dedicated SQL Migration for PromptBazaar
 * Fixes ERROR 0A000 by dropping all dependent policies and constraints FIRST,
 * safely migrating orders.user_id to TEXT without data loss,
 * and creating hardened RLS policies for anonymous checkout, Google Auth, and Admin actions.
 */

// Focused Migration Script specifically for the user's error:
// "cannot alter type of a column used in a policy definition: orders.user_id"
export const ORDERS_RLS_FIX_SQL = `-- =================================================================
-- PROMPTBAZAAR: ORDERS & RLS FIX MIGRATION (RUN IN SUPABASE SQL EDITOR)
-- Fixes ERROR 0A000: cannot alter type of a column used in a policy definition
-- =================================================================

-- STEP 1: DROP ALL DEPENDENT RLS POLICIES FIRST
-- (PostgreSQL forbids altering column type while any policy uses it)
DROP POLICY IF EXISTS "Users can view own orders and admins can view all" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own order" ON public.orders;
DROP POLICY IF EXISTS "Allow users to create pending order" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

-- Dependent secret policies that query orders.user_id
DROP POLICY IF EXISTS "Approved purchasers and admins can view photo secrets" ON public.photo_secrets;
DROP POLICY IF EXISTS "Approved purchasers and admins can view video secrets" ON public.video_secrets;

-- STEP 2: DROP FOREIGN KEY CONSTRAINT ON orders.user_id (if present)
-- This allows anonymous guest orders (user_id 'anon-...') without foreign key errors.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public' 
          AND rel.relname = 'orders' 
          AND con.contype = 'f'
          AND conname LIKE '%user_id%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE;';
    END LOOP;
END $$;

-- STEP 3: DROP INDEX ON orders(user_id) BEFORE TYPE CHANGE
DROP INDEX IF EXISTS public.idx_orders_user;

-- STEP 4: SAFELY ALTER orders.user_id TO TEXT (PRESERVES ALL EXISTING DATA)
ALTER TABLE public.orders ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Recreate indices for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_item ON public.orders(item_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(user_email);

-- Ensure RLS is active
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- STEP 5: RECREATE ORDERS RLS POLICIES SAFELY

-- (5A) INSERT: Both anonymous and authenticated users can create orders,
-- BUT strictly in 'pending' status only! (Prevents bypassing payment)
CREATE POLICY "Users can insert own order" ON public.orders
    FOR INSERT WITH CHECK (
        (status = 'pending' OR status IS NULL)
    );

-- (5B) SELECT: Authenticated users can view ONLY their own orders (by user_id or email).
-- Admins can view all orders for verification. Anonymous users cannot spy on others.
CREATE POLICY "Users can view own orders and admins can view all" ON public.orders
    FOR SELECT USING (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
        OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(orders.user_email) = LOWER(auth.jwt() ->> 'email'))
    );

-- (5C) UPDATE: ONLY Admins can approve or reject orders.
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- (5D) DELETE: ONLY Admins can delete orders.
CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin());

-- STEP 6: RECREATE SECRETS RLS POLICIES SAFELY
-- (Works with TEXT user_id and email matching for Google login!)

CREATE POLICY "Approved purchasers and admins can view photo secrets" ON public.photo_secrets
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = photo_secrets.photo_id
              AND (
                  (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
                  OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(orders.user_email) = LOWER(auth.jwt() ->> 'email'))
              )
              AND orders.status = 'approved'
        )
    );

CREATE POLICY "Approved purchasers and admins can view video secrets" ON public.video_secrets
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = video_secrets.video_id
              AND (
                  (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
                  OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(orders.user_email) = LOWER(auth.jwt() ->> 'email'))
              )
              AND orders.status = 'approved'
        )
    );

-- STEP 7: STORAGE BUCKETS & PAYMENT SCREENSHOTS SECURITY
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Allow upload of payment screenshots for both guest & authenticated buyers
DROP POLICY IF EXISTS "Users upload own payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload payment screenshots" ON storage.objects;
CREATE POLICY "Allow upload payment screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-screenshots'
    );

-- STRICT PRIVACY: Only admins and authenticated owners can view payment screenshots
DROP POLICY IF EXISTS "Admins and owners view payment screenshots" ON storage.objects;
CREATE POLICY "Admins and owners view payment screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-screenshots'
        AND (
            public.is_admin() 
            OR (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Admins delete payment screenshots" ON storage.objects;
CREATE POLICY "Admins delete payment screenshots" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'payment-screenshots'
        AND public.is_admin()
    );

-- STEP 8: SEED ADMIN EMAIL IN public.admins TABLE
INSERT INTO public.admins (email)
VALUES ('mk2106844@gmail.com'), ('admin@promptbazaar.com')
ON CONFLICT (email) DO NOTHING;
`;

export const ADMIN_UPGRADE_SQL = `-- =================================================================
-- PROMPTBAZAAR: COMPLETE ADMIN UPGRADE & ORDERS RLS MIGRATION
-- Run this in Supabase Dashboard -> SQL Editor
-- =================================================================

-- 1. Add featured & display_order columns to photo_items
ALTER TABLE public.photo_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.photo_items ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- 2. Add featured, display_order, free_content & external_video_url to video_items
ALTER TABLE public.video_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.video_items ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.video_items ADD COLUMN IF NOT EXISTS free_content TEXT;
ALTER TABLE public.video_items ADD COLUMN IF NOT EXISTS external_video_url TEXT;

-- 3. Optimize Indices for display order and featured querying
CREATE INDEX IF NOT EXISTS idx_photo_display_order ON public.photo_items(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_video_display_order ON public.video_items(is_featured, display_order);

-- 4. APP SETTINGS TABLE (UPI ID, WhatsApp, QR Image)
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    upi_id TEXT NOT NULL DEFAULT '9718936211@ibl',
    payee_name TEXT NOT NULL DEFAULT 'PromptBazaar',
    whatsapp_number TEXT NOT NULL DEFAULT '+919718936211',
    qr_image_url TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.app_settings (id, upi_id, payee_name, whatsapp_number, qr_image_url)
VALUES ('default', '9718936211@ibl', 'PromptBazaar', '+919718936211', '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view app settings" ON public.app_settings;
CREATE POLICY "Public can view app settings" ON public.app_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
CREATE POLICY "Admins can manage app settings" ON public.app_settings
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. ADMINS TABLE & is_admin() FUNCTION
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.admins (email)
VALUES ('mk2106844@gmail.com'), ('admin@promptbazaar.com')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins 
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
  ) OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) IN ('mk2106844@gmail.com', 'admin@promptbazaar.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
CREATE POLICY "Admins can view admins" ON public.admins
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage admins" ON public.admins;
CREATE POLICY "Admins can manage admins" ON public.admins
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. PHOTO & VIDEO ITEMS RLS POLICIES
DROP POLICY IF EXISTS "Public can view published photo items" ON public.photo_items;
CREATE POLICY "Public can view published photo items" ON public.photo_items
    FOR SELECT USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert photo items" ON public.photo_items;
CREATE POLICY "Admins can insert photo items" ON public.photo_items
    FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update photo items" ON public.photo_items;
CREATE POLICY "Admins can update photo items" ON public.photo_items
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete photo items" ON public.photo_items;
CREATE POLICY "Admins can delete photo items" ON public.photo_items
    FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Public can view published video items" ON public.video_items;
CREATE POLICY "Public can view published video items" ON public.video_items
    FOR SELECT USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage video items" ON public.video_items;
CREATE POLICY "Admins can manage video items" ON public.video_items
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. ORDERS & RLS FIX (DROPPING DEPENDENT POLICIES FIRST TO PREVENT 0A000)
DROP POLICY IF EXISTS "Users can view own orders and admins can view all" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own order" ON public.orders;
DROP POLICY IF EXISTS "Allow users to create pending order" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Approved purchasers and admins can view photo secrets" ON public.photo_secrets;
DROP POLICY IF EXISTS "Approved purchasers and admins can view video secrets" ON public.video_secrets;

-- Drop foreign key constraint on orders.user_id to allow guest orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public' 
          AND rel.relname = 'orders' 
          AND con.contype = 'f'
          AND conname LIKE '%user_id%'
    ) LOOP
        EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE;';
    END LOOP;
END $$;

DROP INDEX IF EXISTS public.idx_orders_user;

-- Safely alter column to TEXT
ALTER TABLE public.orders ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_item ON public.orders(item_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(user_email);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Recreate orders policies
CREATE POLICY "Users can insert own order" ON public.orders
    FOR INSERT WITH CHECK (
        (status = 'pending' OR status IS NULL)
    );

CREATE POLICY "Users can view own orders and admins can view all" ON public.orders
    FOR SELECT USING (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
        OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(orders.user_email) = LOWER(auth.jwt() ->> 'email'))
    );

CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin());

-- Recreate secrets policies
CREATE POLICY "Approved purchasers and admins can view photo secrets" ON public.photo_secrets
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = photo_secrets.photo_id
              AND (
                  (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
                  OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(orders.user_email) = LOWER(auth.jwt() ->> 'email'))
              )
              AND orders.status = 'approved'
        )
    );

DROP POLICY IF EXISTS "Admins can manage photo secrets" ON public.photo_secrets;
CREATE POLICY "Admins can manage photo secrets" ON public.photo_secrets
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Approved purchasers and admins can view video secrets" ON public.video_secrets
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = video_secrets.video_id
              AND (
                  (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
                  OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(orders.user_email) = LOWER(auth.jwt() ->> 'email'))
              )
              AND orders.status = 'approved'
        )
    );

DROP POLICY IF EXISTS "Admins can manage video secrets" ON public.video_secrets;
CREATE POLICY "Admins can manage video secrets" ON public.video_secrets
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7B. SECURE RPCs FOR GUEST ORDERS & PROMPT UNLOCKING
-- get_anon_orders: Returns orders for a specific persisted guest anon_user_id
CREATE OR REPLACE FUNCTION public.get_anon_orders(anon_user_id text)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF anon_user_id IS NULL OR TRIM(anon_user_id) = '' OR LENGTH(TRIM(anon_user_id)) < 8 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.orders
    WHERE orders.user_id = TRIM(anon_user_id)
    ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_anon_orders(text) TO anon, authenticated, service_role;

-- get_unlocked_photo_secret: Unlocks photo prompt only when matching order is approved
CREATE OR REPLACE FUNCTION public.get_unlocked_photo_secret(
    p_photo_id text,
    p_anon_user_id text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_secret text;
BEGIN
    -- 1. Admin caller
    IF public.is_admin() THEN
        SELECT secret_prompt INTO v_secret
        FROM public.photo_secrets
        WHERE photo_id = p_photo_id;
        RETURN v_secret;
    END IF;

    -- 2. Authenticated user with approved order
    IF auth.uid() IS NOT NULL OR auth.jwt() ->> 'email' IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = p_photo_id
              AND (
                  (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
                  OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(orders.user_email) = LOWER(auth.jwt() ->> 'email'))
              )
              AND orders.status = 'approved'
        ) THEN
            SELECT secret_prompt INTO v_secret
            FROM public.photo_secrets
            WHERE photo_id = p_photo_id;
            RETURN v_secret;
        END IF;
    END IF;

    -- 3. Guest user with approved order
    IF p_anon_user_id IS NOT NULL AND TRIM(p_anon_user_id) <> '' THEN
        IF EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = p_photo_id
              AND orders.user_id = TRIM(p_anon_user_id)
              AND orders.status = 'approved'
        ) THEN
            SELECT secret_prompt INTO v_secret
            FROM public.photo_secrets
            WHERE photo_id = p_photo_id;
            RETURN v_secret;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unlocked_photo_secret(text, text) TO anon, authenticated, service_role;

-- get_unlocked_video_secret: Unlocks video prompt only when matching order is approved
CREATE OR REPLACE FUNCTION public.get_unlocked_video_secret(
    p_video_id text,
    p_anon_user_id text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_secret text;
BEGIN
    -- 1. Admin caller
    IF public.is_admin() THEN
        SELECT secret_content INTO v_secret
        FROM public.video_secrets
        WHERE video_id = p_video_id;
        RETURN v_secret;
    END IF;

    -- 2. Authenticated user with approved order
    IF auth.uid() IS NOT NULL OR auth.jwt() ->> 'email' IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = p_video_id
              AND (
                  (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
                  OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(orders.user_email) = LOWER(auth.jwt() ->> 'email'))
              )
              AND orders.status = 'approved'
        ) THEN
            SELECT secret_content INTO v_secret
            FROM public.video_secrets
            WHERE video_id = p_video_id;
            RETURN v_secret;
        END IF;
    END IF;

    -- 3. Guest user with approved order
    IF p_anon_user_id IS NOT NULL AND TRIM(p_anon_user_id) <> '' THEN
        IF EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = p_video_id
              AND orders.user_id = TRIM(p_anon_user_id)
              AND orders.status = 'approved'
        ) THEN
            SELECT secret_content INTO v_secret
            FROM public.video_secrets
            WHERE video_id = p_video_id;
            RETURN v_secret;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unlocked_video_secret(text, text) TO anon, authenticated, service_role;

-- 8. STORAGE BUCKETS & RLS POLICIES
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Public Media Read" ON storage.objects;
CREATE POLICY "Public Media Read" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Allow media uploads" ON storage.objects;
CREATE POLICY "Allow media uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'media'
        AND (
            public.is_admin()
            OR auth.role() = 'authenticated'
        )
    );

DROP POLICY IF EXISTS "Admins update media" ON storage.objects;
CREATE POLICY "Admins update media" ON storage.objects
    FOR UPDATE USING (bucket_id = 'media' AND public.is_admin())
    WITH CHECK (bucket_id = 'media' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete media" ON storage.objects;
CREATE POLICY "Admins delete media" ON storage.objects
    FOR DELETE USING (bucket_id = 'media' AND public.is_admin());

-- Payment Screenshots Bucket
DROP POLICY IF EXISTS "Users upload own payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload payment screenshots" ON storage.objects;
CREATE POLICY "Allow upload payment screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-screenshots'
    );

DROP POLICY IF EXISTS "Admins and owners view payment screenshots" ON storage.objects;
CREATE POLICY "Admins and owners view payment screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-screenshots'
        AND (
            public.is_admin() 
            OR (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Admins delete payment screenshots" ON storage.objects;
CREATE POLICY "Admins delete payment screenshots" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'payment-screenshots'
        AND public.is_admin()
    );
`;
