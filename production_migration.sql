-- =============================================================================
-- PROMPTBAZAAR: PRODUCTION SECURITY MIGRATION & RLS FIXES
-- Ensure to run this script in the Supabase SQL Editor.
-- =============================================================================

-- 1. SECURE ADMIN IDENTITY
-- Requires the user to have a verified email unless they are using Google SSO.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    jwt_email text;
    jwt_verified boolean;
BEGIN
    jwt_email := LOWER(auth.jwt() ->> 'email');
    jwt_verified := COALESCE((auth.jwt() ->> 'email_verified')::boolean, false);

    -- Reject unverified emails
    IF jwt_email IS NULL OR NOT jwt_verified THEN
        RETURN false;
    END IF;

    -- Check admins table or fallback hardcoded emails
    RETURN EXISTS (
        SELECT 1 FROM public.admins
        WHERE LOWER(email) = jwt_email
    ) OR jwt_email IN ('mk2106844@gmail.com', 'admin@promptbazaar.com');
END;
$$;

-- 2. SECURE ORDERS TABLE SCHEMA (Support Guest UUIDs)
-- Drop existing foreign keys and policies that rely on UUID auth
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

-- Convert user_id to TEXT to support anon guest tokens
ALTER TABLE public.orders ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- 3. ORDERS RLS POLICIES
DROP POLICY IF EXISTS "Users can insert own order" ON public.orders;
CREATE POLICY "Users can insert own order" ON public.orders
    FOR INSERT WITH CHECK (
        (status = 'pending' OR status IS NULL)
    );

DROP POLICY IF EXISTS "Users can view own orders and admins can view all" ON public.orders;
CREATE POLICY "Users can view own orders and admins can view all" ON public.orders
    FOR SELECT USING (
        public.is_admin()
        OR (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
        OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(orders.user_email) = LOWER(auth.jwt() ->> 'email'))
    );

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin());

-- 4. DROP INSECURE RPC
-- Dropping this prevents attackers from harvesting guest anon_user_id tokens using public order UUIDs
DROP FUNCTION IF EXISTS public.get_anon_orders(UUID[]);

-- 5. SECURE RPC FUNCTIONS
-- 5A. get_anon_orders
CREATE OR REPLACE FUNCTION public.get_anon_orders(anon_user_id text)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Prevent empty, null, or trivially short guest tokens
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

-- 5B. get_unlocked_photo_secret
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
    IF public.is_admin() THEN
        SELECT secret_prompt INTO v_secret FROM public.photo_secrets WHERE photo_id = (p_photo_id::uuid);
        RETURN v_secret;
    END IF;

    IF auth.uid() IS NOT NULL OR auth.jwt() ->> 'email' IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = (p_photo_id::uuid)
              AND (
                  (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
                  OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(orders.user_email) = LOWER(auth.jwt() ->> 'email'))
              )
              AND orders.status = 'approved'
        ) THEN
            SELECT secret_prompt INTO v_secret FROM public.photo_secrets WHERE photo_id = (p_photo_id::uuid);
            RETURN v_secret;
        END IF;
    END IF;

    IF p_anon_user_id IS NOT NULL AND TRIM(p_anon_user_id) <> '' AND LENGTH(TRIM(p_anon_user_id)) >= 8 THEN
        IF EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = (p_photo_id::uuid)
              AND orders.user_id = TRIM(p_anon_user_id)
              AND orders.status = 'approved'
        ) THEN
            SELECT secret_prompt INTO v_secret FROM public.photo_secrets WHERE photo_id = (p_photo_id::uuid);
            RETURN v_secret;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_unlocked_photo_secret(text, text) TO anon, authenticated, service_role;

-- 5C. get_unlocked_video_secret
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
    IF public.is_admin() THEN
        SELECT secret_content INTO v_secret FROM public.video_secrets WHERE video_id = (p_video_id::uuid);
        RETURN v_secret;
    END IF;

    IF auth.uid() IS NOT NULL OR auth.jwt() ->> 'email' IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = (p_video_id::uuid)
              AND (
                  (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()::text)
                  OR (auth.jwt() ->> 'email' IS NOT NULL AND LOWER(orders.user_email) = LOWER(auth.jwt() ->> 'email'))
              )
              AND orders.status = 'approved'
        ) THEN
            SELECT secret_content INTO v_secret FROM public.video_secrets WHERE video_id = (p_video_id::uuid);
            RETURN v_secret;
        END IF;
    END IF;

    IF p_anon_user_id IS NOT NULL AND TRIM(p_anon_user_id) <> '' AND LENGTH(TRIM(p_anon_user_id)) >= 8 THEN
        IF EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = (p_video_id::uuid)
              AND orders.user_id = TRIM(p_anon_user_id)
              AND orders.status = 'approved'
        ) THEN
            SELECT secret_content INTO v_secret FROM public.video_secrets WHERE video_id = (p_video_id::uuid);
            RETURN v_secret;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_unlocked_video_secret(text, text) TO anon, authenticated, service_role;

-- 6. SECURE MEDIA STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', false) ON CONFLICT (id) DO UPDATE SET public = false;

-- Media Bucket Policies (Read-Only Public, Admin Manage)
DROP POLICY IF EXISTS "Public Media Read" ON storage.objects;
CREATE POLICY "Public Media Read" ON storage.objects FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Admins upload media" ON storage.objects;
DROP POLICY IF EXISTS "Allow media uploads" ON storage.objects;
CREATE POLICY "Allow media uploads" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'media' AND (
        public.is_admin() OR auth.role() = 'authenticated' OR (storage.foldername(name))[1] IN ('payment-qr', 'payment_proofs') OR name LIKE 'payment-qr/%' OR name LIKE 'payment_proofs/%' OR name LIKE 'qr_%'
    )
);

DROP POLICY IF EXISTS "Admins update media" ON storage.objects;
CREATE POLICY "Admins update media" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND public.is_admin()) WITH CHECK (bucket_id = 'media' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete media" ON storage.objects;
CREATE POLICY "Admins delete media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND public.is_admin());

-- Payment Screenshots Policies
DROP POLICY IF EXISTS "Allow upload payment screenshots" ON storage.objects;
CREATE POLICY "Allow upload payment screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-screenshots');

DROP POLICY IF EXISTS "Admins and owners view payment screenshots" ON storage.objects;
CREATE POLICY "Admins and owners view payment screenshots" ON storage.objects FOR SELECT USING (
    bucket_id = 'payment-screenshots' AND (public.is_admin() OR (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text))
);

DROP POLICY IF EXISTS "Admins delete payment screenshots" ON storage.objects;
CREATE POLICY "Admins delete payment screenshots" ON storage.objects FOR DELETE USING (bucket_id = 'payment-screenshots' AND public.is_admin());
