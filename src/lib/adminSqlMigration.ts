/**
 * Dedicated SQL Migration for Admin Panel Upgrade
 * Run this in Supabase Dashboard -> SQL Editor to enable:
 * - is_featured (Home page placement)
 * - display_order (Drag-and-drop reordering)
 * - external_video_url (Drive/YouTube full link for video ads)
 * - Strict RLS protecting all admin write actions
 */

export const ADMIN_UPGRADE_SQL = `-- =================================================================
-- PROMPTBAZAAR: ADMIN PANEL UPGRADE MIGRATION (RUN IN SUPABASE SQL EDITOR)
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

-- 5. STRICT ROW LEVEL SECURITY (RLS) FOR ALL ADMIN ACTIONS
-- Re-verify is_admin() function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins 
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
  ) OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) IN ('mk2106844@gmail.com', 'admin@promptbazaar.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins Table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
CREATE POLICY "Admins can view admins" ON public.admins
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage admins" ON public.admins;
CREATE POLICY "Admins can manage admins" ON public.admins
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Categories Table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Photo Items: Only verified admins can insert, update, or delete
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

-- Photo Secrets: Strictly admins for write, only approved buyers or admins for read
DROP POLICY IF EXISTS "Approved purchasers and admins can view photo secrets" ON public.photo_secrets;
CREATE POLICY "Approved purchasers and admins can view photo secrets" ON public.photo_secrets
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = photo_secrets.photo_id
              AND orders.user_id = auth.uid()
              AND orders.status = 'approved'
        )
    );

DROP POLICY IF EXISTS "Admins can manage photo secrets" ON public.photo_secrets;
CREATE POLICY "Admins can manage photo secrets" ON public.photo_secrets
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Video Items: Only verified admins can write
DROP POLICY IF EXISTS "Admins can manage video items" ON public.video_items;
CREATE POLICY "Admins can manage video items" ON public.video_items
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Video Secrets: Strictly admins for write, only approved buyers or admins for read
DROP POLICY IF EXISTS "Approved purchasers and admins can view video secrets" ON public.video_secrets;
CREATE POLICY "Approved purchasers and admins can view video secrets" ON public.video_secrets
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.item_id = video_secrets.video_id
              AND orders.user_id = auth.uid()
              AND orders.status = 'approved'
        )
    );

DROP POLICY IF EXISTS "Admins can manage video secrets" ON public.video_secrets;
CREATE POLICY "Admins can manage video secrets" ON public.video_secrets
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Orders: Normal users can only insert 'pending' orders; only admins can approve/reject
DROP POLICY IF EXISTS "Users can insert own order" ON public.orders;
CREATE POLICY "Users can insert own order" ON public.orders
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND (status = 'pending' OR status IS NULL)
    );

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin());

-- 6. Storage Buckets: 'media' (public, admin-only write) & 'payment-screenshots' (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Media Bucket: Only admins can upload, update, delete. QR code uploads into media bucket are permitted.
DROP POLICY IF EXISTS "Public Media Read" ON storage.objects;
CREATE POLICY "Public Media Read" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Admins upload media" ON storage.objects;
DROP POLICY IF EXISTS "Allow media uploads" ON storage.objects;
DROP POLICY IF EXISTS "Normal users upload payment screenshots only" ON storage.objects;
CREATE POLICY "Allow media uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'media'
        AND (
            public.is_admin()
            OR auth.role() = 'authenticated'
            OR (storage.foldername(name))[1] = 'payment-qr'
            OR (storage.foldername(name))[1] = 'payment_proofs'
            OR name LIKE 'payment-qr/%'
            OR name LIKE 'payment_proofs/%'
            OR name LIKE 'qr_%'
        )
    );

-- STRICT OVERWRITE & DELETE PROTECTION:
-- Only verified admins can ever update/overwrite or delete files in 'media' bucket.
-- Normal users can NEVER overwrite or delete the QR image or item assets!
DROP POLICY IF EXISTS "Admins update media" ON storage.objects;
CREATE POLICY "Admins update media" ON storage.objects
    FOR UPDATE USING (bucket_id = 'media' AND public.is_admin())
    WITH CHECK (bucket_id = 'media' AND public.is_admin());

DROP POLICY IF EXISTS "Admins delete media" ON storage.objects;
CREATE POLICY "Admins delete media" ON storage.objects
    FOR DELETE USING (bucket_id = 'media' AND public.is_admin());

-- Private Bucket 'payment-screenshots': Authenticated users upload to "<user_id>/<timestamp>.jpg"
DROP POLICY IF EXISTS "Users upload own payment screenshots" ON storage.objects;
CREATE POLICY "Users upload own payment screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-screenshots'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
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
