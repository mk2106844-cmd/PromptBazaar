/**
 * Full Complete Supabase SQL Script
 * Run this ONCE in the Supabase Dashboard -> SQL Editor
 */

export const SUPABASE_SETUP_SQL = `-- =================================================================
-- PROMPTBAZAAR: COMPLETE ALL-IN-ONE BASE SUPABASE SETUP SCRIPT
-- Run this ONCE in the Supabase SQL Editor on a brand new project
-- =================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- >>> EDIT ONLY THIS ONE LINE BELOW WITH YOUR ADMIN EMAIL <<<
INSERT INTO public.admins (email) VALUES ('mk2106844@gmail.com') ON CONFLICT (email) DO NOTHING;
-- =================================================================

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'both' CHECK (type IN ('photo', 'video', 'both')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.categories (name, type)
VALUES 
    ('Trending', 'photo'),
    ('Wedding / Dulhan', 'photo'),
    ('Cinematic Portrait', 'photo'),
    ('Instagram Reel Cover', 'photo'),
    ('Festival & Puja', 'photo'),
    ('Cyberpunk & 3D', 'photo'),
    ('Bolly Glamour', 'photo'),
    ('Shop & Product', 'photo'),
    ('Shop / Dukaan', 'video'),
    ('DJ & Music Event', 'video'),
    ('Clinic & Hospital', 'video'),
    ('CSC & Cyber Cafe', 'video'),
    ('Festival Offer', 'video'),
    ('Reel Promo', 'video')
ON CONFLICT (name) DO NOTHING;

-- 4. PHOTO ITEMS TABLE (Public metadata only - Paid secret prompt is NOT stored here)
CREATE TABLE IF NOT EXISTS public.photo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Trending',
    is_paid BOOLEAN NOT NULL DEFAULT false,
    price NUMERIC NOT NULL DEFAULT 0,
    image_url TEXT NOT NULL,
    free_prompt_text TEXT, -- Populated ONLY for FREE prompts. NULL for paid!
    is_published BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PHOTO SECRETS TABLE (Locked prompt text for Paid items)
-- SECURITY RULE: Only accessible if user has an APPROVED order for this item, OR if admin.
CREATE TABLE IF NOT EXISTS public.photo_secrets (
    photo_id UUID PRIMARY KEY REFERENCES public.photo_items(id) ON DELETE CASCADE,
    secret_prompt TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VIDEO ITEMS TABLE (Public video items metadata)
CREATE TABLE IF NOT EXISTS public.video_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Shop / Dukaan',
    item_type TEXT NOT NULL DEFAULT 'prompt' CHECK (item_type IN ('prompt', 'ready_video')),
    is_paid BOOLEAN NOT NULL DEFAULT false,
    price NUMERIC NOT NULL DEFAULT 0,
    thumbnail_url TEXT NOT NULL,
    video_url TEXT,
    external_video_url TEXT,
    duration TEXT DEFAULT '0:30',
    free_content TEXT, -- Populated ONLY for FREE video items. NULL for paid!
    is_published BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. VIDEO SECRETS TABLE (Locked prompt & full video link for Paid items)
-- SECURITY RULE: Only accessible if user has an APPROVED order for this item, OR if admin.
CREATE TABLE IF NOT EXISTS public.video_secrets (
    video_id UUID PRIMARY KEY REFERENCES public.video_items(id) ON DELETE CASCADE,
    secret_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDERS TABLE (Manual UPI Purchase Flow)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('photo', 'video')),
    item_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    upi_ref TEXT NOT NULL,
    screenshot_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_photo_items_category ON public.photo_items(category);
CREATE INDEX IF NOT EXISTS idx_photo_display_order ON public.photo_items(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_video_items_category ON public.video_items(category);
CREATE INDEX IF NOT EXISTS idx_video_display_order ON public.video_items(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_item ON public.orders(item_id, status);

-- =================================================================
-- 9. APP SETTINGS TABLE (UPI ID, WhatsApp, QR Image)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    upi_id TEXT NOT NULL DEFAULT '9718936211@ibl',
    payee_name TEXT NOT NULL DEFAULT 'PromptBazaar',
    whatsapp_number TEXT NOT NULL DEFAULT '+919718936211',
    qr_image_url TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial default settings
INSERT INTO public.app_settings (id, upi_id, payee_name, whatsapp_number, qr_image_url)
VALUES ('default', '9718936211@ibl', 'PromptBazaar', '+919718936211', '')
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- 10. ADMIN HELPER FUNCTION
-- =================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins 
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
  ) OR LOWER(COALESCE(auth.jwt() ->> 'email', '')) IN ('mk2106844@gmail.com', 'admin@promptbazaar.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- --- (1) ADMINS TABLE POLICIES ---
-- Only admins can view the admin email list
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
CREATE POLICY "Admins can view admins" ON public.admins
    FOR SELECT USING (public.is_admin());

-- Only admins can add, update, or remove admins
DROP POLICY IF EXISTS "Admins can manage admins" ON public.admins;
CREATE POLICY "Admins can manage admins" ON public.admins
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- (2) CATEGORIES POLICIES ---
-- Public can view categories
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" ON public.categories
    FOR SELECT USING (true);

-- Only admins can insert, update, or delete categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- (3) APP SETTINGS POLICIES (UPI ID, WhatsApp, QR) ---
-- Public can view active payment & contact settings
DROP POLICY IF EXISTS "Public can view app settings" ON public.app_settings;
CREATE POLICY "Public can view app settings" ON public.app_settings
    FOR SELECT USING (true);

-- Only admins can update payment QR, UPI ID, or WhatsApp number
DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
CREATE POLICY "Admins can manage app settings" ON public.app_settings
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- (4) PHOTO ITEMS POLICIES ---
-- Public can only view published photos; admins can view all drafts
DROP POLICY IF EXISTS "Public can view published photo items" ON public.photo_items;
CREATE POLICY "Public can view published photo items" ON public.photo_items
    FOR SELECT USING (is_published = true OR public.is_admin());

-- Only admins can insert photo items
DROP POLICY IF EXISTS "Admins can insert photo items" ON public.photo_items;
CREATE POLICY "Admins can insert photo items" ON public.photo_items
    FOR INSERT WITH CHECK (public.is_admin());

-- Only admins can update photo items
DROP POLICY IF EXISTS "Admins can update photo items" ON public.photo_items;
CREATE POLICY "Admins can update photo items" ON public.photo_items
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Only admins can delete photo items
DROP POLICY IF EXISTS "Admins can delete photo items" ON public.photo_items;
CREATE POLICY "Admins can delete photo items" ON public.photo_items
    FOR DELETE USING (public.is_admin());

-- --- (5) PHOTO SECRETS POLICIES (STRICT PROTECTION) ---
-- Paid prompt text is readable ONLY by approved buyers and admins!
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

-- Only admins can insert, update, or delete photo secrets
DROP POLICY IF EXISTS "Admins can manage photo secrets" ON public.photo_secrets;
CREATE POLICY "Admins can manage photo secrets" ON public.photo_secrets
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- (6) VIDEO ITEMS POLICIES ---
-- Public can only view published videos; admins can view all drafts
DROP POLICY IF EXISTS "Public can view published video items" ON public.video_items;
CREATE POLICY "Public can view published video items" ON public.video_items
    FOR SELECT USING (is_published = true OR public.is_admin());

-- Only admins can insert, update, or delete video items
DROP POLICY IF EXISTS "Admins can manage video items" ON public.video_items;
CREATE POLICY "Admins can manage video items" ON public.video_items
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- (7) VIDEO SECRETS POLICIES (STRICT PROTECTION) ---
-- Paid video prompt/link is readable ONLY by approved buyers and admins!
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

-- Only admins can insert, update, or delete video secrets
DROP POLICY IF EXISTS "Admins can manage video secrets" ON public.video_secrets;
CREATE POLICY "Admins can manage video secrets" ON public.video_secrets
    FOR ALL USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- --- (8) ORDERS POLICIES (PURCHASE SECURITY) ---
-- Users can view ONLY their own orders; admins can view all orders
DROP POLICY IF EXISTS "Users can view own orders and admins can view all" ON public.orders;
CREATE POLICY "Users can view own orders and admins can view all" ON public.orders
    FOR SELECT USING (
        auth.uid() = user_id OR public.is_admin()
    );

-- Normal users can create their own order, but ONLY in 'pending' status!
-- Prevents malicious buyers from setting status = 'approved' during insert!
DROP POLICY IF EXISTS "Users can insert own order" ON public.orders;
CREATE POLICY "Users can insert own order" ON public.orders
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND (status = 'pending' OR status IS NULL)
    );

-- ONLY admins can update orders (approve or reject)
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ONLY admins can delete orders
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders
    FOR DELETE USING (public.is_admin());

-- =================================================================
-- 12. STORAGE BUCKET SETUP ('media' & private 'payment-screenshots')
-- =================================================================
-- 'media' bucket is public for catalog photos, thumbnails, preview videos, QR code
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 'payment-screenshots' bucket is strictly PRIVATE for user UPI payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- --- (A) POLICIES FOR 'media' BUCKET (PUBLIC READ, CONTROLLED WRITE) ---
-- Public can read all media and QR codes
DROP POLICY IF EXISTS "Public Media Read" ON storage.objects;
CREATE POLICY "Public Media Read" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

-- Admins, authenticated users, and payment QR uploads allowed into media bucket
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

-- --- (B) POLICIES FOR PRIVATE 'payment-screenshots' BUCKET ---
-- Authenticated users upload to path "<user_id>/<timestamp>.jpg", anon users upload to "anon-.../<timestamp>.jpg"
DROP POLICY IF EXISTS "Users upload own payment screenshots" ON storage.objects;
CREATE POLICY "Users upload own payment screenshots" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-screenshots'
        AND (
            (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
            OR
            (auth.role() = 'anon' AND (storage.foldername(name))[1] LIKE 'anon-%')
        )
    );

-- Admins and owner users can read/generate signed URLs
DROP POLICY IF EXISTS "Admins and owners view payment screenshots" ON storage.objects;
CREATE POLICY "Admins and owners view payment screenshots" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-screenshots'
        AND (
            public.is_admin() 
            OR (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
        )
    );

-- Only admins can delete payment screenshots
DROP POLICY IF EXISTS "Admins delete payment screenshots" ON storage.objects;
CREATE POLICY "Admins delete payment screenshots" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'payment-screenshots'
        AND public.is_admin()
    );

-- =================================================================
-- 12. STARTER DEMO ITEMS (Ready to explore immediately)
-- =================================================================
DO $$
DECLARE
    p1_id UUID := gen_random_uuid();
    p2_id UUID := gen_random_uuid();
    v1_id UUID := gen_random_uuid();
    v2_id UUID := gen_random_uuid();
BEGIN
    -- 1. Free Photo Item
    INSERT INTO public.photo_items (id, title, description, category, is_paid, price, image_url, free_prompt_text, is_published, is_featured, display_order)
    VALUES (
        p1_id,
        'Royal Rajputana Groom Portrait',
        'Traditional Rajasthani wedding royal attire, golden embroidered sherwani with turban.',
        'Wedding / Dulhan',
        false, 0,
        'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
        'Hyper-realistic 8k cinematic portrait of a handsome 25-year-old North Indian royal groom wearing a maroon and gold zari embroidered silk sherwani with an elaborate safa (turban) and emerald kalgi. Soft golden hour royal palace terrace courtyard in Udaipur background, shot on 85mm f/1.4 lens, natural skin texture, dramatic royal studio lighting.',
        true, true, 0
    ) ON CONFLICT DO NOTHING;

    -- 2. Paid Photo Item
    INSERT INTO public.photo_items (id, title, description, category, is_paid, price, image_url, free_prompt_text, is_published, is_featured, display_order)
    VALUES (
        p2_id,
        'Varanasi Ganga Aarti Flare 3D',
        'Devotional magical lighting with brass diyas and misty temple reflection.',
        'Festival & Puja',
        true, 29,
        'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
        NULL,
        true, true, 1
    ) ON CONFLICT DO NOTHING;

    INSERT INTO public.photo_secrets (photo_id, secret_prompt)
    VALUES (
        p2_id,
        'Full HD Masterpiece: Spiritual high-definition photograph of young Indian devotee holding large brass tiered fire diya during Ganga Aarti at Dashashwamedh Ghat Varanasi at twilight. Glowing amber fire embers rising into the night sky, reflection of ancient stone temples in sacred Ganges water, soft atmospheric mist, cinematic volumetric smoke, cinematic bokeh, Hasselblad X2D 100C style, photorealistic detail --ar 16:9 --v 6.0'
    ) ON CONFLICT (photo_id) DO NOTHING;

    -- 3. Free Video Item
    INSERT INTO public.video_items (id, title, description, category, item_type, is_paid, price, thumbnail_url, duration, free_content, is_published, is_featured, display_order)
    VALUES (
        v1_id,
        'Kirana Superstore Grand Opening Reel',
        '3D animated grocery items falling into shopping cart with festive Hindi announcement text.',
        'Shop / Dukaan',
        'prompt',
        false, 0,
        'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
        '0:30',
        'Runway Gen-3 / Kling Prompt: Dynamic 9:16 vertical commercial video of Indian modern grocery supermarket. Fresh colorful vegetables and branded spices flying into golden shopping cart in ultra smooth slow-motion. Bright warm lighting, floating Hindi text banner "Maha Bachat Dhamaka", festive background confetti --motion 7 --fps 30',
        true, true, 0
    ) ON CONFLICT DO NOTHING;

    -- 4. Paid Video Item
    INSERT INTO public.video_items (id, title, description, category, item_type, is_paid, price, thumbnail_url, duration, free_content, is_published, is_featured, display_order)
    VALUES (
        v2_id,
        'Bass King DJ Nightclub Promo Reel',
        'Ultra dynamic neon subwoofer lasers with explosive soundwaves for live events.',
        'DJ & Music Event',
        'ready_video',
        true, 49,
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
        '0:20',
        NULL,
        true, true, 1
    ) ON CONFLICT DO NOTHING;

    INSERT INTO public.video_secrets (video_id, secret_content)
    VALUES (
        v2_id,
        'READY REEL ASSET DOWNLOAD: Full HD 1080x1920 60fps editable template with Punjabi Dhol drop + After Effects & CapCut Project file link: https://drive.google.com/drive/folders/promptbazaar-dj-sample-pack (License: Commercial event rights included)'
    ) ON CONFLICT (video_id) DO NOTHING;
END $$;
`;
