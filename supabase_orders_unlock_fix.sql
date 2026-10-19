-- =============================================================================
-- PROMPTBAZAAR: COMPLETE ORDERS & UNLOCK RPC MIGRATION
-- Fixes:
-- 1. ERROR 0A000 (Drops dependent policies before altering orders.user_id to TEXT)
-- 2. Guest Order Tracking: get_anon_orders(anon_user_id) RPC
-- 3. Prompt Unlocking: get_unlocked_photo_secret & get_unlocked_video_secret RPCs
-- 4. Prevents unauthorized reading of others' orders while allowing guests to unlock approved prompts
-- =============================================================================

-- STEP 1: ADMINS TABLE & is_admin() FUNCTION
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

-- STEP 2: DROP ALL DEPENDENT POLICIES ON orders, photo_secrets & video_secrets FIRST
-- This completely avoids "ERROR 0A000: cannot alter type of a column used in a policy definition"
DROP POLICY IF EXISTS "Users can view own orders and admins can view all" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own order" ON public.orders;
DROP POLICY IF EXISTS "Allow users to create pending order" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Approved purchasers and admins can view photo secrets" ON public.photo_secrets;
DROP POLICY IF EXISTS "Approved purchasers and admins can view video secrets" ON public.video_secrets;
DROP POLICY IF EXISTS "Admins can manage photo secrets" ON public.photo_secrets;
DROP POLICY IF EXISTS "Admins can manage video secrets" ON public.video_secrets;

-- Drop foreign key constraint on orders.user_id if present
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

-- Drop existing index on orders.user_id
DROP INDEX IF EXISTS public.idx_orders_user;

-- Safely convert orders.user_id column to TEXT to support both Supabase Auth UUIDs and guest anon IDs
ALTER TABLE public.orders ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Recreate indices
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_item ON public.orders(item_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(user_email);

-- Ensure RLS is active
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- STEP 3: RECREATE ORDERS RLS POLICIES
-- Anyone can insert a pending order
CREATE POLICY "Users can insert own order" ON public.orders
    FOR INSERT WITH CHECK (
        (status = 'pending' OR status IS NULL)
    );

-- Authenticated users view their own orders; admins view all; direct queries by matching user_id allowed
CREATE POLICY "Users can view own orders and admins can view all" ON public.orders
    FOR SELECT USING (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
        OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(orders.user_email) = LOWER(auth.jwt() ->> 'email'))
    );

-- Only admins can update orders (e.g. approve or reject)
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Only admins can delete orders
CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin());

-- STEP 4: RECREATE SECRETS POLICIES
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

CREATE POLICY "Admins can manage video secrets" ON public.video_secrets
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- STEP 5: SECURE RPC FUNCTIONS FOR GUEST ORDERS & PROMPT UNLOCKING

-- 1. get_anon_orders: Returns orders for a specific persisted guest ID
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

-- 2. get_unlocked_photo_secret: Unlocks prompt only when matching order is approved
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
    -- Admin caller
    IF public.is_admin() THEN
        SELECT secret_prompt INTO v_secret
        FROM public.photo_secrets
        WHERE photo_id = p_photo_id;
        RETURN v_secret;
    END IF;

    -- Authenticated user with approved order
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

    -- Guest user with approved order
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

-- 3. get_unlocked_video_secret: Unlocks video prompt only when matching order is approved
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
    -- Admin caller
    IF public.is_admin() THEN
        SELECT secret_content INTO v_secret
        FROM public.video_secrets
        WHERE video_id = p_video_id;
        RETURN v_secret;
    END IF;

    -- Authenticated user with approved order
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

    -- Guest user with approved order
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

-- STEP 6: STORAGE BUCKETS AND PAYMENT SCREENSHOT POLICIES
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO UPDATE SET public = false;

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
