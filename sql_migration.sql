-- Drop the old conflicting functions to avoid parameter name mismatch ambiguity
DROP FUNCTION IF EXISTS public.get_unlocked_photo_secret(text, text);
DROP FUNCTION IF EXISTS public.get_unlocked_photo_secret(text);
DROP FUNCTION IF EXISTS public.get_unlocked_video_secret(text, text);
DROP FUNCTION IF EXISTS public.get_unlocked_video_secret(text);
DROP FUNCTION IF EXISTS public.get_anon_orders(text);
DROP FUNCTION IF EXISTS public.get_anon_orders(UUID[]);

-- 1. get_anon_orders: Returns orders for a specific persisted guest anon_user_id
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

-- 2. get_unlocked_photo_secret: Unlocks photo prompt only when matching order is approved
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

-- Ensure Schema Cache gets reloaded!
NOTIFY pgrst, 'reload schema';
