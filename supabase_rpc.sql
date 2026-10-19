-- =============================================================================
-- PROMPTBAZAAR: RPC FUNCTIONS FOR GUEST ORDERS & PROMPT UNLOCKING
-- Run this in Supabase Dashboard -> SQL Editor
-- =============================================================================

-- 1A. Fetch anonymous orders by exact persisted anon_user_id
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

-- 1B. Overload: Fetch anonymous orders by list of order UUIDs
CREATE OR REPLACE FUNCTION public.get_anon_orders(order_ids UUID[])
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.orders
  WHERE id = ANY(order_ids)
    AND (user_id LIKE 'anon-%' OR user_id IS NULL)
  ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_anon_orders(UUID[]) TO anon, authenticated, service_role;

-- 2. Unlock photo prompt secret only if matching order is approved
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
    -- Admin bypass
    IF public.is_admin() THEN
        SELECT secret_prompt INTO v_secret
        FROM public.photo_secrets
        WHERE photo_id = (p_photo_id::uuid);
        RETURN v_secret;
    END IF;

    -- Authenticated user with approved order
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
            SELECT secret_prompt INTO v_secret
            FROM public.photo_secrets
            WHERE photo_id = (p_photo_id::uuid);
            RETURN v_secret;
        END IF;
    END IF;

    -- Guest user with approved order
    IF p_anon_user_id IS NOT NULL AND TRIM(p_anon_user_id) <> '' THEN
        IF EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = (p_photo_id::uuid)
              AND orders.user_id = TRIM(p_anon_user_id)
              AND orders.status = 'approved'
        ) THEN
            SELECT secret_prompt INTO v_secret
            FROM public.photo_secrets
            WHERE photo_id = (p_photo_id::uuid);
            RETURN v_secret;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unlocked_photo_secret(text, text) TO anon, authenticated, service_role;

-- 3. Unlock video secret content only if matching order is approved
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
    -- Admin bypass
    IF public.is_admin() THEN
        SELECT secret_content INTO v_secret
        FROM public.video_secrets
        WHERE video_id = (p_video_id::uuid);
        RETURN v_secret;
    END IF;

    -- Authenticated user with approved order
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
            SELECT secret_content INTO v_secret
            FROM public.video_secrets
            WHERE video_id = (p_video_id::uuid);
            RETURN v_secret;
        END IF;
    END IF;

    -- Guest user with approved order
    IF p_anon_user_id IS NOT NULL AND TRIM(p_anon_user_id) <> '' THEN
        IF EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = (p_video_id::uuid)
              AND orders.user_id = TRIM(p_anon_user_id)
              AND orders.status = 'approved'
        ) THEN
            SELECT secret_content INTO v_secret
            FROM public.video_secrets
            WHERE video_id = (p_video_id::uuid);
            RETURN v_secret;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unlocked_video_secret(text, text) TO anon, authenticated, service_role;
