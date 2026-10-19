import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../config';
import { PhotoItem, VideoItem, Order } from '../types';
import { compressImageTo1MB, compressImageTo500KB } from './compression';

// Production Supabase project credentials for PromptBazaar
export const DEFAULT_SUPABASE_URL = 'https://ugrtslgrwbocwzwxtlxx.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_ZXGRag1pF3vzxICmnk8GDA_zSMoptE-';

const rawUrl = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  ''
).trim();

const rawKey = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  ''
).trim();

// If env var is missing or remains the placeholder from template, use production credentials
const isPlaceholderUrl = !rawUrl || rawUrl.includes('your-project-id');
const isPlaceholderKey = !rawKey || rawKey.includes('...');

export const supabaseUrl = !isPlaceholderUrl ? rawUrl : DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = !isPlaceholderKey ? rawKey : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

// Real Supabase client instance
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Initial sample seed data for instant testing
 */
export const INITIAL_PHOTO_ITEMS: PhotoItem[] = [
  {
    id: 'p-1',
    title: 'Royal Rajputana Groom Portrait',
    description: 'Traditional Rajasthani wedding royal attire, golden embroidered sherwani with turban.',
    category: 'Wedding / Dulhan',
    is_paid: false,
    price: 0,
    image_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80',
    free_prompt_text: 'Hyper-realistic 8k cinematic portrait of a handsome 25-year-old North Indian royal groom wearing a maroon and gold zari embroidered silk sherwani with an elaborate safa (turban) and emerald kalgi. Soft golden hour royal palace terrace courtyard in Udaipur background, shot on 85mm f/1.4 lens, natural skin texture, dramatic royal studio lighting.',
    is_published: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'p-2',
    title: 'Varanasi Ganga Aarti Flare 3D',
    description: 'Devotional magical lighting with brass diyas and misty temple reflection.',
    category: 'Festival & Puja',
    is_paid: true,
    price: 29,
    image_url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
    // Notice: free_prompt_text is NOT sent for paid items!
    is_published: true,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'p-3',
    title: 'Cyberpunk Mumbai Auto 2077',
    description: 'Futuristic neon auto-rickshaw drifting through rain-soaked Marine Drive.',
    category: 'Cyberpunk & 3D',
    is_paid: true,
    price: 49,
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    is_published: true,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'p-4',
    title: 'Sabyasachi Aesthetic Bridal Close-Up',
    description: 'Deep red velvet lehenga with kundan jewelry, editorial magazine cover.',
    category: 'Wedding / Dulhan',
    is_paid: false,
    price: 0,
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    free_prompt_text: 'Close-up high-fashion portrait of an Indian bride with smoky kohl-lined eyes, elegant nath (nose ring), and heavy maang tikka, wearing deep crimson velvet bridal lehenga with antique gold zardozi work. Sabyasachi heritage aesthetic, warm earthy studio tones, soft natural diffused Rembrandt lighting, award-winning Vogue India cover shot.',
    is_published: true,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'p-5',
    title: 'Hauz Khas Aesthetic Cafe Portrait',
    description: 'Casual luxury street look for Indian male influencer Instagram feed.',
    category: 'Instagram Reel Cover',
    is_paid: true,
    price: 19,
    image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    is_published: true,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'p-6',
    title: 'Diwali Golden Sparkler Bokeh',
    description: 'Joyful festival portrait with phuljhadi sparklers and warm glow.',
    category: 'Festival & Puja',
    is_paid: false,
    price: 0,
    image_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
    free_prompt_text: 'Joyful young Indian woman in yellow silk kurti holding a golden phuljhadi sparkler at night on a terrace decorated with clay diyas and marigold garlands. Sparkling golden trails illuminated against dark evening sky, beautiful bokeh circles, warm joyful festive celebration, 50mm f/1.2 lens, hyper-realistic candid portrait.',
    is_published: true,
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

export const INITIAL_PHOTO_SECRETS: Record<string, string> = {
  'p-2': 'Full HD Masterpiece: Spiritual high-definition photograph of young Indian devotee holding large brass tiered fire diya during Ganga Aarti at Dashashwamedh Ghat Varanasi at twilight. Glowing amber fire embers rising into the night sky, reflection of ancient stone temples in sacred Ganges water, soft atmospheric mist, cinematic volumetric smoke, cinematic bokeh, Hasselblad X2D 100C style, photorealistic detail --ar 16:9 --v 6.0',
  'p-3': 'Futuristic Mumbai 2077 concept art: Neon-lit green and yellow auto-rickshaw hovercraft hovering 2 feet above glowing rain-soaked neon asphalt in Bandra. Holographic Hindi and Devanagari signage in electric cyan and magenta, high-tech LED exhaust glow, reflective puddles, dark moody Blade Runner atmosphere, ultra-sharp 8k octane render.',
  'p-5': 'Candid lifestyle editorial of a stylish 24-year-old Indian creator sitting at a sunlit rustic outdoor cafe in Hauz Khas Village. Wearing beige linen oversized shirt, vintage silver wristwatch, subtle messy textured hair, laughing naturally while holding an iced espresso. Dappled sunlight through bougainvillea flowers, 35mm film photography grain, Kodak Portra 400 aesthetic, candid realism.',
};

/**
 * Initial sample seed data for Video Ads
 */
export const INITIAL_VIDEO_ITEMS: VideoItem[] = [
  {
    id: 'v-1',
    title: 'Kirana Superstore Grand Opening Reel',
    description: '3D animated grocery items falling into shopping cart with festive Hindi announcement text.',
    category: 'Shop / Dukaan',
    item_type: 'prompt',
    is_paid: false,
    price: 0,
    thumbnail_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-shopping-cart-in-a-supermarket-42566-large.mp4',
    duration: '0:30',
    free_content: 'Runway Gen-3 / Kling Prompt: Dynamic 9:16 vertical commercial video of Indian modern grocery supermarket. Fresh colorful vegetables and branded spices flying into golden shopping cart in ultra smooth slow-motion. Bright warm lighting, floating Hindi text banner "Maha Bachat Dhamaka", festive background confetti --motion 7 --fps 30',
    is_published: true,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'v-2',
    title: 'Bass King DJ Nightclub Promo Reel',
    description: 'Ultra dynamic neon subwoofer lasers with explosive soundwaves for live events.',
    category: 'DJ & Music Event',
    item_type: 'ready_video',
    is_paid: true,
    price: 49,
    thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-dj-mixing-music-at-a-club-party-42470-large.mp4',
    duration: '0:20',
    // Paid item: free_content is NOT sent on public list!
    is_published: true,
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
  {
    id: 'v-3',
    title: 'Dental Care & Clinic Doctor Ad',
    description: 'Professional doctor smile makeover video ad with patient trust elements.',
    category: 'Clinic & Hospital',
    item_type: 'prompt',
    is_paid: true,
    price: 39,
    thumbnail_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    duration: '0:35',
    is_published: true,
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'v-4',
    title: 'CSC Cyber Cafe Government Service Reel',
    description: 'Fast energetic reel highlighting PAN card, Aadhaar update, and scholarship forms.',
    category: 'CSC & Cyber Cafe',
    item_type: 'ready_video',
    is_paid: false,
    price: 0,
    thumbnail_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
    duration: '0:25',
    free_content: 'FREE READY REEL DOWNLOAD: 1080x1920 Clean Canva / CapCut Template with trending energetic background music. Customizable phone number and shop name overlay: https://canva.com/design/promptbazaar-csc-free-template',
    is_published: true,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'v-5',
    title: 'Diwali Festival Mega Offer Ad Reel',
    description: 'Festive gold sparkles, traditional diyas and 50% discount ribbon animation.',
    category: 'Festival Offer',
    item_type: 'prompt',
    is_paid: true,
    price: 29,
    thumbnail_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
    duration: '0:30',
    is_published: true,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export const INITIAL_VIDEO_SECRETS: Record<string, string> = {
  'v-2': 'READY REEL ASSET DOWNLOAD: Full HD 1080x1920 60fps editable template with Punjabi Dhol drop + After Effects & CapCut Project file link: https://drive.google.com/drive/folders/promptbazaar-dj-sample-pack (License: Commercial event rights included)',
  'v-3': 'Luma Dream Machine + ElevenLabs Script: "Cinematic 9:16 video of a confident, friendly Indian male dentist in white coat explaining painless laser teeth whitening in modern high-tech clinic. Patient smiling with bright white teeth. Soft medical teal and white aesthetic. Voiceover (Hindi): \\"Paiye motiyo jaise chamakdar daant bina kisi dard ke! Aaj hi book karein.\\" --quality high',
  'v-5': 'Runway Gen-3 Prompt: "Festive Indian celebration 9:16 vertical commercial. Golden animated gift boxes bursting open into golden sparkles, glowing clay diyas and marigold flower background. Floating 3D golden text \\"DIWALI DHAMAKA SALE - FLAT 50% OFF\\". Cinematic lighting, celebratory Diwali fireworks bokeh, 4k ultra-hd video --motion 8',
};

// Local storage keys
const LS_PHOTOS_KEY = 'promptbazaar_photos_v1';
const LS_SECRETS_KEY = 'promptbazaar_secrets_v1';
const LS_VIDEOS_KEY = 'promptbazaar_videos_v1';
const LS_VIDEO_SECRETS_KEY = 'promptbazaar_video_secrets_v1';
const LS_ORDERS_KEY = 'promptbazaar_orders_v1';
export const LS_GUEST_ID_KEY = 'promptbazaar_guest_id';

/**
 * Returns the stable, persisted guest ID for this browser session/device.
 * If previous guest orders exist in localStorage, re-uses that exact anon ID
 * so existing orders can be tracked and unlocked!
 */
export function getPersistedGuestId(): string {
  try {
    const saved = localStorage.getItem(LS_GUEST_ID_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }

    // Check existing orders in localStorage to inherit any previously used anon ID
    const rawOrders = localStorage.getItem(LS_ORDERS_KEY);
    if (rawOrders) {
      const parsedOrders = JSON.parse(rawOrders);
      if (Array.isArray(parsedOrders)) {
        for (const o of parsedOrders) {
          if (o?.user_id && typeof o.user_id === 'string' && o.user_id.startsWith('anon-')) {
            localStorage.setItem(LS_GUEST_ID_KEY, o.user_id);
            return o.user_id;
          }
        }
      }
    }

    // Generate high-entropy secure guest ID (timestamp + cryptographically random hex)
    const randPart = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).substring(2, 14);
    const newGuestId = `anon-${Date.now()}-${randPart}`;
    localStorage.setItem(LS_GUEST_ID_KEY, newGuestId);
    return newGuestId;
  } catch {
    return `anon-${Date.now()}`;
  }
}

/**
 * Returns all distinct anon_user_ids associated with this browser (including past orders).
 */
export function getAllGuestIds(): string[] {
  const ids = new Set<string>();
  const current = getPersistedGuestId();
  if (current) ids.add(current);

  try {
    const rawOrders = localStorage.getItem(LS_ORDERS_KEY);
    if (rawOrders) {
      const parsedOrders = JSON.parse(rawOrders);
      if (Array.isArray(parsedOrders)) {
        for (const o of parsedOrders) {
          if (o?.user_id && typeof o.user_id === 'string' && o.user_id.startsWith('anon-')) {
            ids.add(o.user_id);
          }
        }
      }
    }
  } catch {}

  return Array.from(ids);
}

/**
 * Data Repository API - Works seamlessly with Supabase or falls back to reactive local state
 */
export const dataApi = {
  // Fetch all published photo items (Notice: secrets are NEVER bundled for paid items!)
  async getPhotoItems(): Promise<PhotoItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let { data, error } = await supabase
          .from('photo_items')
          .select('id, title, description, category, is_paid, price, image_url, free_prompt_text, is_published, created_at, is_featured, display_order')
          .eq('is_published', true)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[Supabase Notice] Retrying photo_items with core columns:', error.message);
          const fallback = await supabase
            .from('photo_items')
            .select('id, title, description, category, is_paid, price, image_url, free_prompt_text, is_published, created_at')
            .eq('is_published', true)
            .order('created_at', { ascending: false });
          data = fallback.data as any;
          error = fallback.error;
        }

        if (error) {
          console.error('[Supabase Error] dataApi.getPhotoItems failed:', error);
          throw error;
        }

        return data || [];
      } catch (err) {
        console.error('[Supabase Network/Query Error] dataApi.getPhotoItems:', err);
        throw err;
      }
    }

    // Fallback to local storage or initial seeds ONLY when Supabase is not configured
    const saved = localStorage.getItem(LS_PHOTOS_KEY);
    if (saved) {
      try {
        const parsed: PhotoItem[] = JSON.parse(saved);
        return parsed.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      } catch {
        // fallback
      }
    }
    localStorage.setItem(LS_PHOTOS_KEY, JSON.stringify(INITIAL_PHOTO_ITEMS));
    localStorage.setItem(LS_SECRETS_KEY, JSON.stringify(INITIAL_PHOTO_SECRETS));
    return INITIAL_PHOTO_ITEMS;
  },

  // Fetch published photo items with range() pagination for Infinite Scroll on Home
  // Keeps selecting ONLY safe public columns, never secret prompt text of paid items.
  async getPhotoItemsPaginated({
    page = 0,
    pageSize = 12,
    category,
  }: {
    page: number;
    pageSize?: number;
    category?: string;
  }): Promise<{ items: PhotoItem[]; hasMore: boolean }> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('photo_items')
          .select('id, title, description, category, is_paid, price, image_url, free_prompt_text, is_published, created_at, is_featured, display_order', { count: 'exact' })
          .eq('is_published', true);

        if (category && category !== 'All') {
          query = query.eq('category', category);
        }

        query = query
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .range(from, to);

        let { data, error, count } = await query;

        if (error) {
          console.warn('[Supabase Notice] Retrying paginated photo_items query with core columns:', error.message);
          let fallbackQuery = supabase
            .from('photo_items')
            .select('id, title, description, category, is_paid, price, image_url, free_prompt_text, is_published, created_at', { count: 'exact' })
            .eq('is_published', true);

          if (category && category !== 'All') {
            fallbackQuery = fallbackQuery.eq('category', category);
          }

          const fbRes = await fallbackQuery
            .order('created_at', { ascending: false })
            .range(from, to);

          data = fbRes.data as any;
          error = fbRes.error;
          count = fbRes.count;
        }

        if (error) {
          console.error('[Supabase Error] dataApi.getPhotoItemsPaginated failed:', error);
          throw error;
        }

        const items = data || [];
        const hasMore = count !== null ? to + 1 < count : items.length === pageSize;
        return { items, hasMore };
      } catch (err) {
        console.error('[Supabase Network/Query Error] dataApi.getPhotoItemsPaginated:', err);
        throw err;
      }
    }

    // Fallback ONLY when Supabase is not configured
    const all = await this.getPhotoItems();
    const filtered = all
      .filter((p) => p.is_published !== false)
      .filter((p) => !category || category === 'All' || p.category === category)
      .sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    const items = filtered.slice(from, to + 1);
    const hasMore = to + 1 < filtered.length;
    return { items, hasMore };
  },

  // Admin get ALL photo items including unpublished
  async getAllPhotoItemsAdmin(): Promise<PhotoItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('photo_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Supabase Error] dataApi.getAllPhotoItemsAdmin failed:', error);
          throw error;
        }

        return data || [];
      } catch (err) {
        console.error('[Supabase Network/Query Error] dataApi.getAllPhotoItemsAdmin:', err);
        throw err;
      }
    }

    const saved = localStorage.getItem(LS_PHOTOS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return INITIAL_PHOTO_ITEMS;
  },

  // Save new or update photo item
  async savePhotoItem(item: Partial<PhotoItem>, secretPrompt?: string): Promise<PhotoItem> {
    const id = item.id || (isSupabaseConfigured ? undefined : `p-${Date.now()}`);

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Insert/Update photo_items
        const photoPayload = {
          title: item.title,
          description: item.description || '',
          category: item.category || 'Trending',
          is_paid: item.is_paid ?? false,
          price: item.is_paid ? (item.price || 29) : 0,
          image_url: item.image_url,
          free_prompt_text: item.is_paid ? null : (item.free_prompt_text || secretPrompt),
          is_published: item.is_published ?? true,
          is_featured: item.is_featured ?? false,
          display_order: item.display_order ?? 0,
        };

        let resultItem: PhotoItem;

        if (item.id) {
          const { data, error } = await supabase
            .from('photo_items')
            .update(photoPayload)
            .eq('id', item.id)
            .select()
            .single();
          if (error) throw error;
          resultItem = data;
        } else {
          const { data, error } = await supabase
            .from('photo_items')
            .insert(photoPayload)
            .select()
            .single();
          if (error) throw error;
          resultItem = data;
        }

        // 2. If it's paid and secretPrompt is provided, write to photo_secrets
        if (item.is_paid && secretPrompt && resultItem.id) {
          const { error: secretError } = await supabase
            .from('photo_secrets')
            .upsert({
              photo_id: resultItem.id,
              secret_prompt: secretPrompt,
            });
          if (secretError) {
            console.error('[Supabase Error] upsert photo_secrets failed:', secretError);
            throw new Error(`Secret prompt save failed: ${secretError.message}`);
          }
        }

        // Keep local cache in sync for offline resilience
        try {
          const existing: PhotoItem[] = JSON.parse(localStorage.getItem(LS_PHOTOS_KEY) || '[]');
          const idx = existing.findIndex((x) => x.id === resultItem.id);
          if (idx >= 0) existing[idx] = resultItem;
          else existing.unshift(resultItem);
          localStorage.setItem(LS_PHOTOS_KEY, JSON.stringify(existing));
        } catch {
          // quota
        }

        return resultItem;
      } catch (err: any) {
        console.error('Failed to save photo to Supabase:', err);
        throw err;
      }
    }

    // Local Storage logic
    const existing: PhotoItem[] = JSON.parse(localStorage.getItem(LS_PHOTOS_KEY) || JSON.stringify(INITIAL_PHOTO_ITEMS));
    const secrets: Record<string, string> = JSON.parse(localStorage.getItem(LS_SECRETS_KEY) || JSON.stringify(INITIAL_PHOTO_SECRETS));

    const finalId = item.id || `p-${Date.now()}`;
    const newItem: PhotoItem = {
      id: finalId,
      title: item.title || 'Untitled Prompt',
      description: item.description || '',
      category: item.category || 'Trending',
      is_paid: Boolean(item.is_paid),
      price: item.is_paid ? (Number(item.price) || 29) : 0,
      image_url: item.image_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
      free_prompt_text: item.is_paid ? undefined : (item.free_prompt_text || secretPrompt),
      is_published: item.is_published ?? true,
      is_featured: item.is_featured ?? false,
      display_order: item.display_order ?? 0,
      created_at: item.created_at || new Date().toISOString(),
    };

    const index = existing.findIndex((x) => x.id === finalId);
    if (index >= 0) {
      existing[index] = newItem;
    } else {
      existing.unshift(newItem);
    }
    localStorage.setItem(LS_PHOTOS_KEY, JSON.stringify(existing));

    if (item.is_paid && secretPrompt) {
      secrets[finalId] = secretPrompt;
      localStorage.setItem(LS_SECRETS_KEY, JSON.stringify(secrets));
    }

    return newItem;
  },

  // Delete photo item
  async deletePhotoItem(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      // 1. Delete associated secret row from photo_secrets first
      const { error: secretError } = await supabase
        .from('photo_secrets')
        .delete()
        .eq('photo_id', id);

      if (secretError) {
        console.error('Supabase photo_secrets delete error:', secretError);
        throw new Error(`photo_secrets delete failed: ${secretError.message}`);
      }

      // 2. Delete item from photo_items
      const { error: itemError } = await supabase
        .from('photo_items')
        .delete()
        .eq('id', id);

      if (itemError) {
        console.error('Supabase photo_items delete error:', itemError);
        throw new Error(`photo_items delete failed: ${itemError.message}`);
      }

      try {
        const existing: PhotoItem[] = JSON.parse(localStorage.getItem(LS_PHOTOS_KEY) || '[]');
        localStorage.setItem(LS_PHOTOS_KEY, JSON.stringify(existing.filter((x) => x.id !== id)));
        const secrets = JSON.parse(localStorage.getItem(LS_SECRETS_KEY) || '{}');
        delete secrets[id];
        localStorage.setItem(LS_SECRETS_KEY, JSON.stringify(secrets));
      } catch {}

      return true;
    }

    const existing: PhotoItem[] = JSON.parse(localStorage.getItem(LS_PHOTOS_KEY) || JSON.stringify(INITIAL_PHOTO_ITEMS));
    const filtered = existing.filter((x) => x.id !== id);
    localStorage.setItem(LS_PHOTOS_KEY, JSON.stringify(filtered));
    try {
      const secrets: Record<string, string> = JSON.parse(localStorage.getItem(LS_SECRETS_KEY) || JSON.stringify(INITIAL_PHOTO_SECRETS));
      delete secrets[id];
      localStorage.setItem(LS_SECRETS_KEY, JSON.stringify(secrets));
    } catch {}
    return true;
  },

  // Fetch Secret Prompt (Protected by RLS & get_unlocked_photo_secret RPC on backend)
  async getSecretPrompt(
    photoId: string,
    userEmail?: string,
    isAdmin = false,
    guestUserId?: string
  ): Promise<string | null> {
    const effectiveGuestId = guestUserId || getPersistedGuestId();

    if (isSupabaseConfigured && supabase) {
      // 1. Direct select (for authenticated / admin users via RLS)
      try {
        const { data, error } = await supabase
          .from('photo_secrets')
          .select('secret_prompt')
          .eq('photo_id', photoId)
          .maybeSingle();

        if (!error && data?.secret_prompt) {
          return data.secret_prompt;
        }
      } catch (err) {
        // Continue to RPC
      }

      // 2. Try get_unlocked_photo_secret RPC (unlocks if order status = 'approved')
      try {
        const { data, error } = await supabase.rpc('get_unlocked_photo_secret', {
          p_photo_id: photoId,
          p_anon_user_id: effectiveGuestId || null,
        });

        if (!error && data) {
          try {
            const secrets = JSON.parse(localStorage.getItem(LS_SECRETS_KEY) || '{}');
            secrets[photoId] = data;
            localStorage.setItem(LS_SECRETS_KEY, JSON.stringify(secrets));
          } catch {}
          return data;
        }
      } catch (err) {
        console.warn('[Supabase RPC Notice] get_unlocked_photo_secret:', err);
      }
    }

    // 3. Fallback: only allow if user has approved order in verified local cache or is admin
    const orders: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
    const hasApprovedOrder = orders.some(
      (o) =>
        o.item_id === photoId &&
        o.status === 'approved' &&
        (!userEmail || o.user_email?.toLowerCase() === userEmail.toLowerCase() || (effectiveGuestId && o.user_id === effectiveGuestId))
    );

    if (hasApprovedOrder || isAdmin) {
      const secrets: Record<string, string> = JSON.parse(
        localStorage.getItem(LS_SECRETS_KEY) || JSON.stringify(INITIAL_PHOTO_SECRETS)
      );
      return secrets[photoId] || null;
    }

    return null;
  },

  // ==========================================
  // VIDEO ADS DATA METHODS (PHASE 2)
  // ==========================================

  // Fetch all published video items (Notice: secret_content is NEVER bundled for paid items!)
  async getVideoItems(): Promise<VideoItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('video_items')
          .select('id, title, description, category, item_type, is_paid, price, thumbnail_url, video_url, duration, free_content, is_published, created_at')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Supabase Error] dataApi.getVideoItems failed:', error);
          throw error;
        }

        return data || [];
      } catch (err) {
        console.error('[Supabase Network/Query Error] dataApi.getVideoItems:', err);
        throw err;
      }
    }

    const saved = localStorage.getItem(LS_VIDEOS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    localStorage.setItem(LS_VIDEOS_KEY, JSON.stringify(INITIAL_VIDEO_ITEMS));
    localStorage.setItem(LS_VIDEO_SECRETS_KEY, JSON.stringify(INITIAL_VIDEO_SECRETS));
    return INITIAL_VIDEO_ITEMS;
  },

  // Admin get ALL video items including unpublished
  async getAllVideoItemsAdmin(): Promise<VideoItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('video_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Supabase Error] dataApi.getAllVideoItemsAdmin failed:', error);
          throw error;
        }

        return data || [];
      } catch (err) {
        console.error('[Supabase Network/Query Error] dataApi.getAllVideoItemsAdmin:', err);
        throw err;
      }
    }

    const saved = localStorage.getItem(LS_VIDEOS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return INITIAL_VIDEO_ITEMS;
  },

  // Save new or update video item
  async saveVideoItem(item: Partial<VideoItem>, secretContent?: string): Promise<VideoItem> {
    const finalId = item.id || (isSupabaseConfigured ? undefined : `v-${Date.now()}`);

    if (isSupabaseConfigured && supabase) {
      try {
        const videoPayload = {
          title: item.title,
          description: item.description || '',
          category: item.category || 'Shop / Dukaan',
          item_type: item.item_type || 'prompt',
          is_paid: item.is_paid ?? false,
          price: item.is_paid ? (item.price || 39) : 0,
          thumbnail_url: item.thumbnail_url,
          video_url: item.video_url || null,
          external_video_url: item.is_paid ? null : (item.external_video_url || null),
          duration: item.duration || '0:30',
          free_content: item.is_paid ? null : (item.free_content || secretContent),
          is_published: item.is_published ?? true,
          is_featured: item.is_featured ?? false,
          display_order: item.display_order ?? 0,
        };

        let resultItem: VideoItem;

        if (item.id) {
          const { data, error } = await supabase
            .from('video_items')
            .update(videoPayload)
            .eq('id', item.id)
            .select()
            .single();
          if (error) throw error;
          resultItem = data;
        } else {
          const { data, error } = await supabase
            .from('video_items')
            .insert(videoPayload)
            .select()
            .single();
          if (error) throw error;
          resultItem = data;
        }

        // If paid and secretContent (or external_video_url) provided, upsert to video_secrets
        if (item.is_paid && (secretContent || item.external_video_url) && resultItem.id) {
          const finalSecret = item.external_video_url 
            ? `${secretContent || ''}\nFull Video Link: ${item.external_video_url}`.trim()
            : (secretContent || '');

          const { error: secretError } = await supabase
            .from('video_secrets')
            .upsert({
              video_id: resultItem.id,
              secret_content: finalSecret,
            });
          if (secretError) {
            console.error('[Supabase Error] upsert video_secrets failed:', secretError);
            throw new Error(`Video secret save failed: ${secretError.message}`);
          }
        }

        // Keep local cache in sync for offline resilience
        try {
          const existing: VideoItem[] = JSON.parse(localStorage.getItem(LS_VIDEOS_KEY) || '[]');
          const idx = existing.findIndex((x) => x.id === resultItem.id);
          if (idx >= 0) existing[idx] = resultItem;
          else existing.unshift(resultItem);
          localStorage.setItem(LS_VIDEOS_KEY, JSON.stringify(existing));
        } catch {
          // quota
        }

        return resultItem;
      } catch (err: any) {
        console.error('Failed to save video to Supabase:', err);
        throw err;
      }
    }

    // Local Storage logic
    const existing: VideoItem[] = JSON.parse(localStorage.getItem(LS_VIDEOS_KEY) || JSON.stringify(INITIAL_VIDEO_ITEMS));
    const secrets: Record<string, string> = JSON.parse(localStorage.getItem(LS_VIDEO_SECRETS_KEY) || JSON.stringify(INITIAL_VIDEO_SECRETS));

    const idToUse = item.id || `v-${Date.now()}`;
    const newVideo: VideoItem = {
      id: idToUse,
      title: item.title || 'Untitled Video Ad',
      description: item.description || '',
      category: item.category || 'Shop / Dukaan',
      item_type: item.item_type || 'prompt',
      is_paid: Boolean(item.is_paid),
      price: item.is_paid ? (Number(item.price) || 39) : 0,
      thumbnail_url: item.thumbnail_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      video_url: item.video_url,
      external_video_url: item.is_paid ? undefined : item.external_video_url,
      duration: item.duration || '0:30',
      free_content: item.is_paid ? undefined : (item.free_content || secretContent),
      is_published: item.is_published ?? true,
      is_featured: item.is_featured ?? false,
      display_order: item.display_order ?? 0,
      created_at: item.created_at || new Date().toISOString(),
    };

    const index = existing.findIndex((x) => x.id === idToUse);
    if (index >= 0) {
      existing[index] = newVideo;
    } else {
      existing.unshift(newVideo);
    }
    localStorage.setItem(LS_VIDEOS_KEY, JSON.stringify(existing));

    if (item.is_paid && (secretContent || item.external_video_url)) {
      secrets[idToUse] = item.external_video_url 
        ? `${secretContent || ''}\nFull Video Link: ${item.external_video_url}`.trim()
        : (secretContent || '');
      localStorage.setItem(LS_VIDEO_SECRETS_KEY, JSON.stringify(secrets));
    }

    return newVideo;
  },

  // Delete video item
  async deleteVideoItem(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      // 1. Delete associated secret row from video_secrets first
      const { error: secretError } = await supabase
        .from('video_secrets')
        .delete()
        .eq('video_id', id);

      if (secretError) {
        console.error('Supabase video_secrets delete error:', secretError);
        throw new Error(`video_secrets delete failed: ${secretError.message}`);
      }

      // 2. Delete item from video_items
      const { error: itemError } = await supabase
        .from('video_items')
        .delete()
        .eq('id', id);

      if (itemError) {
        console.error('Supabase video_items delete error:', itemError);
        throw new Error(`video_items delete failed: ${itemError.message}`);
      }

      try {
        const existing: VideoItem[] = JSON.parse(localStorage.getItem(LS_VIDEOS_KEY) || '[]');
        localStorage.setItem(LS_VIDEOS_KEY, JSON.stringify(existing.filter((x) => x.id !== id)));
        const secrets = JSON.parse(localStorage.getItem(LS_VIDEO_SECRETS_KEY) || '{}');
        delete secrets[id];
        localStorage.setItem(LS_VIDEO_SECRETS_KEY, JSON.stringify(secrets));
      } catch {}

      return true;
    }

    const existing: VideoItem[] = JSON.parse(localStorage.getItem(LS_VIDEOS_KEY) || JSON.stringify(INITIAL_VIDEO_ITEMS));
    const filtered = existing.filter((x) => x.id !== id);
    localStorage.setItem(LS_VIDEOS_KEY, JSON.stringify(filtered));
    try {
      const secrets: Record<string, string> = JSON.parse(localStorage.getItem(LS_VIDEO_SECRETS_KEY) || JSON.stringify(INITIAL_VIDEO_SECRETS));
      delete secrets[id];
      localStorage.setItem(LS_VIDEO_SECRETS_KEY, JSON.stringify(secrets));
    } catch {}
    return true;
  },

  // Fetch Secret Video Content (Protected by RLS and get_unlocked_video_secret RPC on backend)
  async getVideoSecret(
    videoId: string,
    userEmail?: string,
    isAdmin = false,
    guestUserId?: string
  ): Promise<string | null> {
    const effectiveGuestId = guestUserId || getPersistedGuestId();

    if (isSupabaseConfigured && supabase) {
      // 1. Direct select (for authenticated / admin users via RLS)
      try {
        const { data, error } = await supabase
          .from('video_secrets')
          .select('secret_content')
          .eq('video_id', videoId)
          .maybeSingle();

        if (!error && data?.secret_content) {
          try {
            const secrets = JSON.parse(localStorage.getItem(LS_VIDEO_SECRETS_KEY) || '{}');
            secrets[videoId] = data.secret_content;
            localStorage.setItem(LS_VIDEO_SECRETS_KEY, JSON.stringify(secrets));
          } catch {}
          return data.secret_content;
        }
      } catch (err) {
        // Continue to RPC
      }

      // 2. Try get_unlocked_video_secret RPC (unlocks if order status = 'approved')
      try {
        const { data, error } = await supabase.rpc('get_unlocked_video_secret', {
          p_video_id: videoId,
          p_anon_user_id: effectiveGuestId || null,
        });

        if (!error && data) {
          try {
            const secrets = JSON.parse(localStorage.getItem(LS_VIDEO_SECRETS_KEY) || '{}');
            secrets[videoId] = data;
            localStorage.setItem(LS_VIDEO_SECRETS_KEY, JSON.stringify(secrets));
          } catch {}
          return data;
        }
      } catch (err) {
        console.warn('[Supabase RPC Notice] get_unlocked_video_secret:', err);
      }
    }

    // In local mode: only allow if user has approved order for this video or is admin
    const orders: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
    const hasApprovedOrder = orders.some(
      (o) =>
        o.item_id === videoId &&
        o.status === 'approved' &&
        (!userEmail || o.user_email?.toLowerCase() === userEmail.toLowerCase() || (effectiveGuestId && o.user_id === effectiveGuestId))
    );

    if (hasApprovedOrder || isAdmin) {
      const secrets: Record<string, string> = JSON.parse(
        localStorage.getItem(LS_VIDEO_SECRETS_KEY) || JSON.stringify(INITIAL_VIDEO_SECRETS)
      );
      if (secrets[videoId]) return secrets[videoId];

      const videos: VideoItem[] = JSON.parse(localStorage.getItem(LS_VIDEOS_KEY) || '[]');
      const targetVideo = videos.find((v) => v.id === videoId);
      if (targetVideo?.free_content) return targetVideo.free_content;

      return null;
    }

    return null;
  },

  // Create an Order (Pending UPI approval)
  async createOrder(orderData: {
    userId: string;
    userEmail: string;
    itemType: 'photo' | 'video';
    itemId: string;
    amount: number;
    upiRef: string;
    screenshotUrl?: string;
  }): Promise<Order> {
    const generatedId = `ord-${Date.now()}`;
    const fallbackOrder: Order = {
      id: generatedId,
      user_id: orderData.userId,
      user_email: orderData.userEmail.trim().toLowerCase(),
      item_type: orderData.itemType,
      item_id: orderData.itemId,
      amount: orderData.amount,
      upi_ref: orderData.upiRef.trim(),
      screenshot_url: orderData.screenshotUrl,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          user_id: orderData.userId,
          user_email: orderData.userEmail.trim().toLowerCase(),
          item_type: orderData.itemType,
          item_id: orderData.itemId,
          amount: orderData.amount,
          upi_ref: orderData.upiRef.trim(),
          screenshot_url: orderData.screenshotUrl || null,
          status: 'pending',
        };

        const { data, error } = await supabase
          .from('orders')
          .insert(payload)
          .select()
          .maybeSingle();

        if (!error && data) {
          // Sync with local cache for instant UI feedback
          const orders: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
          orders.unshift(data);
          localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(orders));
          return data;
        }

        if (error) {
          // If select failed because user is anon (PGRST116), the insert still succeeded in DB
          if (error.code === 'PGRST116' || error.message?.includes('0 rows')) {
            const orders: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
            orders.unshift(fallbackOrder);
            localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(orders));
            return fallbackOrder;
          }

          console.error('[Supabase Error] dataApi.createOrder failed:', error);
          throw new Error(`Order save nahi ho saka: ${error.message}`);
        }
      } catch (err: any) {
        console.error('Supabase create order failed:', err);
        throw err;
      }
    }

    // Local storage fallback only if Supabase not configured
    const orders: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
    orders.unshift(fallbackOrder);
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(orders));
    return fallbackOrder;
  },

  // Fetch orders for current user (supports matching by user_id OR user_email for Google login, and guest anon_user_id)
  async getUserOrders(userId?: string, userEmail?: string, explicitGuestId?: string): Promise<Order[]> {
    const cleanEmail = userEmail?.trim().toLowerCase();
    const persistedGuestId = explicitGuestId || getPersistedGuestId();
    const guestIds = getAllGuestIds();
    if (persistedGuestId && !guestIds.includes(persistedGuestId)) {
      guestIds.push(persistedGuestId);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        let fetchedDbOrders: Order[] = [];

        // 1. If user is authenticated, query orders by userId or cleanEmail
        if (userId || cleanEmail) {
          let query = supabase.from('orders').select('*');
          if (userId && cleanEmail) {
            query = query.or(`user_id.eq.${userId},user_email.ilike.${cleanEmail}`);
          } else if (userId) {
            query = query.eq('user_id', userId);
          } else if (cleanEmail) {
            query = query.ilike('user_email', cleanEmail);
          }
          const { data, error } = await query.order('created_at', { ascending: false });
          if (!error && data) {
            fetchedDbOrders = data;
          } else if (error) {
            console.error('[Supabase Error] dataApi.getUserOrders authenticated query failed:', error);
          }
        }

        // 2. Query guest orders using get_anon_orders RPC (Requirement 2 & 9)
        // Also query for all guest IDs associated with this browser session
        if (!userId || guestIds.length > 0) {
          for (const gId of guestIds) {
            if (!gId || !gId.trim()) continue;
            let rpcSucceeded = false;
            try {
              // Exact expected RPC signature: get_anon_orders(anon_user_id)
              const { data: rpcOrders, error: rpcErr } = await supabase.rpc('get_anon_orders', {
                anon_user_id: gId,
              });

              if (!rpcErr && Array.isArray(rpcOrders)) {
                rpcSucceeded = true;
                for (const ro of rpcOrders) {
                  if (!fetchedDbOrders.some((existing) => existing.id === ro.id)) {
                    fetchedDbOrders.push(ro);
                  }
                }
              } else if (rpcErr) {
                // If database has get_anon_orders(order_ids UUID[]) variant
                const localOrdersForCheck: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
                const localUuids = localOrdersForCheck
                  .map((o) => o.id)
                  .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

                if (localUuids.length > 0) {
                  const { data: uuidOrders, error: uuidErr } = await supabase.rpc('get_anon_orders', {
                    order_ids: localUuids,
                  });
                  if (!uuidErr && Array.isArray(uuidOrders) && uuidOrders.length > 0) {
                    rpcSucceeded = true;
                    for (const uo of uuidOrders) {
                      if (!fetchedDbOrders.some((existing) => existing.id === uo.id)) {
                        fetchedDbOrders.push(uo);
                      }
                    }
                  }
                }

                if (!rpcSucceeded) {
                  console.warn('[Supabase RPC Notice] get_anon_orders:', rpcErr.message);
                }
              }
            } catch (rpcEx) {
              console.warn('[Supabase RPC Exception] get_anon_orders:', rpcEx);
            }

            // Fallback direct table query if RPC was not executed or not found
            if (!rpcSucceeded) {
              try {
                const { data: directOrders, error: directErr } = await supabase
                  .from('orders')
                  .select('*')
                  .eq('user_id', gId)
                  .order('created_at', { ascending: false });

                if (!directErr && directOrders) {
                  for (const dro of directOrders) {
                    if (!fetchedDbOrders.some((existing) => existing.id === dro.id)) {
                      fetchedDbOrders.push(dro);
                    }
                  }
                }
              } catch (directEx) {
                console.warn('[Supabase Direct Query Notice]:', directEx);
              }
            }
          }
        }

        // 3. Sync local orders cache with the latest status from Supabase (Requirement 4)
        // And replace/remove any duplicate placeholder orders (Requirement 7)
        const localOrders: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
        const updatedLocal = [...localOrders];

        // For each database order, update matching local orders
        for (const dbOrder of fetchedDbOrders) {
          const matchIndex = updatedLocal.findIndex((lo) => lo.id === dbOrder.id);
          if (matchIndex >= 0) {
            updatedLocal[matchIndex] = { ...updatedLocal[matchIndex], ...dbOrder };
          } else {
            // Check if there's a temporary client-generated ord- placeholder matching this order
            const placeholderIdx = updatedLocal.findIndex(
              (lo) =>
                lo.id.startsWith('ord-') &&
                lo.item_id === dbOrder.item_id &&
                (lo.user_id === dbOrder.user_id || (lo.upi_ref && lo.upi_ref === dbOrder.upi_ref))
            );
            if (placeholderIdx >= 0) {
              // Replace placeholder with the real database order!
              updatedLocal[placeholderIdx] = dbOrder;
            } else {
              updatedLocal.unshift(dbOrder);
            }
          }
        }

        // Clean up any stale placeholder where an approved database order exists for the same item
        const finalLocal = updatedLocal.filter((o) => {
          if (o.id.startsWith('ord-')) {
            const hasRealDbMatch = fetchedDbOrders.some(
              (dbo) => dbo.item_id === o.item_id && (dbo.user_id === o.user_id || (dbo.upi_ref && dbo.upi_ref === o.upi_ref))
            );
            return !hasRealDbMatch;
          }
          return true;
        });

        // Save synchronized orders back to localStorage
        try {
          localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(finalLocal));
        } catch {}

        // Return combined, deduplicated, sorted list
        const finalMap = new Map<string, Order>();
        for (const o of fetchedDbOrders) {
          finalMap.set(o.id, o);
        }
        for (const lo of finalLocal) {
          if (!finalMap.has(lo.id)) {
            const matchesUser =
              (userId && lo.user_id === userId) ||
              (cleanEmail && lo.user_email?.toLowerCase() === cleanEmail) ||
              guestIds.includes(lo.user_id);
            if (matchesUser) {
              finalMap.set(lo.id, lo);
            }
          }
        }

        const sorted = Array.from(finalMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return sorted;
      } catch (err) {
        console.error('[Supabase Network/Query Error] dataApi.getUserOrders:', err);
      }
    }

    // Offline / Local storage fallback
    const orders: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
    if (!userEmail && !userId && guestIds.length === 0) return orders;
    return orders.filter(
      (o) =>
        (userId && o.user_id === userId) ||
        (cleanEmail && o.user_email?.toLowerCase() === cleanEmail) ||
        guestIds.includes(o.user_id)
    );
  },

  // Admin fetch all orders
  async getAllOrdersAdmin(): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Supabase Error] dataApi.getAllOrdersAdmin failed:', error);
          throw error;
        }

        return data || [];
      } catch (err) {
        console.error('[Supabase Network/Query Error] dataApi.getAllOrdersAdmin:', err);
        throw err;
      }
    }

    const orders: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
    return orders;
  },

  // Admin Delete Order
  async deleteOrder(orderId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);

        if (error) {
          console.error('[Supabase Error] deleteOrder failed:', error);
          throw new Error(`Order delete nahi ho saka: ${error.message}`);
        }

        // Sync with local cache
        const orders: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
        const filtered = orders.filter((o) => o.id !== orderId);
        localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(filtered));

        return true;
      } catch (err: any) {
        console.error('Failed to delete order in Supabase:', err);
        throw err;
      }
    }

    const orders: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
    const filtered = orders.filter((o) => o.id !== orderId);
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(filtered));
    return true;
  },

  // Admin Update Order Status (Approve / Reject)
  async updateOrderStatus(orderId: string, status: 'approved' | 'rejected'): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', orderId);

        if (error) {
          console.error('[Supabase Error] updateOrderStatus failed:', error);
          throw new Error(`Order status update nahi ho saka: ${error.message}`);
        }

        // Sync with local cache
        const orders: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
        const target = orders.find((o) => o.id === orderId);
        if (target) {
          target.status = status;
          target.updated_at = new Date().toISOString();
          localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(orders));
        }

        return true;
      } catch (err: any) {
        console.error('Failed to update order status in Supabase:', err);
        throw err;
      }
    }

    const orders: Order[] = JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
    const target = orders.find((o) => o.id === orderId);
    if (target) {
      target.status = status;
      target.updated_at = new Date().toISOString();
      localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(orders));
      return true;
    }
    return false;
  },

  // ==========================================
  // APP SETTINGS (UPI ID, QR, WHATSAPP)
  // ==========================================
  async getAppSettingsFromDb(): Promise<{ upiId: string; payeeName: string; whatsappNumber: string; qrImageUrl?: string } | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 'default')
          .single();

        if (!error && data) {
          return {
            upiId: data.upi_id,
            payeeName: data.payee_name,
            whatsappNumber: data.whatsapp_number,
            qrImageUrl: data.qr_image_url || '',
          };
        }

        if (error) {
          // If table not found in schema cache (PGRST205) or does not exist, silently fallback to localStorage
          if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.code === '42P01') {
            return null;
          }
          console.warn('Supabase app_settings query notice:', error.message);
        }
      } catch (err: any) {
        // Silent fallback for missing schema cache
        if (err?.code !== 'PGRST205') {
          console.warn('Notice: app_settings not accessible, using local store.');
        }
      }
    }
    return null;
  },

  /**
   * Upload payment QR image to Supabase storage bucket 'media'.
   * Never returns or stores base64 text. Returns ONLY the public URL.
   */
  async uploadPaymentQrImage(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Kripya sirf valid image file (JPG, PNG, WEBP) upload karein.');
    }

    const compressed = await compressImageTo500KB(file);

    if (isSupabaseConfigured && supabase) {
      // Ensure session exists if anonymous auth is available in the Supabase project
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          try {
            await supabase.auth.signInAnonymously();
          } catch {
            // Anonymous sign-in not enabled in project, proceed with current role
          }
        }
      } catch {}

      const ext = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();

      // Candidate paths inside 'media' bucket:
      // 1. payment-qr/qr_<timestamp>.<ext> (modern folder structure)
      // 2. qr_<timestamp>.<ext> (root directory)
      // 3. payment_proofs/qr_<timestamp>.<ext> (backward-compatible folder from initial setup)
      const candidatePaths = [
        `payment-qr/qr_${timestamp}.${ext}`,
        `qr_${timestamp}.${ext}`,
        `payment_proofs/qr_${timestamp}.${ext}`,
      ];

      let lastError: any = null;

      for (const targetPath of candidatePaths) {
        try {
          const { data, error } = await supabase.storage
            .from('media')
            .upload(targetPath, compressed.file, {
              cacheControl: '3600',
              upsert: true,
              contentType: compressed.file.type || 'image/jpeg',
            });

          if (!error && (data?.path || targetPath)) {
            const { data: publicData } = supabase.storage
              .from('media')
              .getPublicUrl(data?.path || targetPath);

            if (publicData?.publicUrl && !publicData.publicUrl.startsWith('data:')) {
              return publicData.publicUrl;
            }
          }

          if (error) {
            lastError = error;
            const msg = error.message?.toLowerCase() || '';
            const isRls = msg.includes('row-level security') || msg.includes('policy') || (error as any).statusCode === '403';
            if (isRls) {
              // Try the next candidate path format
              continue;
            }
            break;
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      if (lastError) {
        const msg = lastError.message?.toLowerCase() || '';
        const isRls = msg.includes('row-level security') || msg.includes('policy') || (lastError as any).statusCode === '403';
        if (isRls) {
          throw new Error('Supabase "media" bucket me storage RLS policy allow nahi hai. Kripya "SQL Setup" se updated storage SQL script run karein.');
        }
        throw new Error(`Supabase 'media' bucket me QR upload fail hua: ${lastError.message}`);
      }
    }

    throw new Error('Supabase connect nahi hai. QR image upload karne ke liye Supabase connection zaroori hai.');
  },

  async saveAppSettingsToDb(settings: { upiId?: string; payeeName?: string; whatsappNumber?: string; qrImageUrl?: string }): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      // Validate: Strictly do not store base64 text in database
      if (settings.qrImageUrl && settings.qrImageUrl.startsWith('data:')) {
        throw new Error('Base64 image text save karna mana hai. Kripya image file upload karein taaki yeh "media" bucket me save ho.');
      }

      const payload: Record<string, any> = {
        id: 'default',
        updated_at: new Date().toISOString(),
      };
      if (settings.upiId !== undefined) payload.upi_id = settings.upiId.trim();
      if (settings.payeeName !== undefined) payload.payee_name = settings.payeeName.trim();
      if (settings.whatsappNumber !== undefined) payload.whatsapp_number = settings.whatsappNumber.trim();
      if (settings.qrImageUrl !== undefined) payload.qr_image_url = settings.qrImageUrl.trim();

      const { error } = await supabase
        .from('app_settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          throw new Error('Supabase me "app_settings" table nahi mili. Kripya SQL Editor me table create karein.');
        }
        throw new Error(`Supabase app_settings me save nahi ho saka: ${error.message}`);
      }

      return true;
    }
    throw new Error('Supabase is not configured.');
  },

  // ==========================================
  // PAYMENT SCREENSHOTS (PRIVATE BUCKET 'payment-screenshots')
  // ==========================================
  /**
   * Upload payment screenshot to private bucket 'payment-screenshots'
   * Path format: "<user_id>/<timestamp>.jpg"
   * Compresses image to strictly under 1 MB.
   * Returns ONLY the file path (e.g. "<user_id>/<timestamp>.jpg") for storing in orders table.
   */
  async uploadPaymentScreenshot(file: File, userId: string): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Kripya sirf image file (JPG, PNG, WEBP) upload karein.');
    }

    // 1. Auto-compress to strictly under 1 MB
    const compressed = await compressImageTo1MB(file);
    const timestamp = Date.now();
    const cleanUserId = userId || 'anonymous';
    const filePath = `${cleanUserId}/${timestamp}.jpg`;

    // Track storage bytes
    const currentBytes = Number(localStorage.getItem('promptbazaar_storage_ledger_bytes') || '142606336');
    localStorage.setItem('promptbazaar_storage_ledger_bytes', String(currentBytes + compressed.compressedSizeBytes));

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.storage
        .from('payment-screenshots')
        .upload(filePath, compressed.file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (error) {
        console.error('Failed to upload payment screenshot to payment-screenshots bucket:', error);
        throw new Error(`Screenshot upload fail hua: ${error.message}`);
      }

      // Return ONLY the path inside the bucket, NEVER a public URL!
      return data?.path || filePath;
    }

    // Local development fallback: cache dataUrl in localStorage for preview
    try {
      localStorage.setItem(`promptbazaar_screenshot_${filePath}`, compressed.dataUrl);
    } catch {
      // quota
    }

    return filePath;
  },

  /**
   * Generates a 300-second signed URL for admin to view the private payment screenshot
   */
  async getPaymentScreenshotSignedUrl(path: string, expiresIn = 300): Promise<string | null> {
    if (!path) return null;

    // If legacy URL (http or data:)
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('payment-screenshots')
          .createSignedUrl(path, expiresIn);

        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
        if (error) {
          console.warn('createSignedUrl error:', error.message);
        }
      } catch (err) {
        console.warn('Failed to generate signed URL for payment screenshot:', err);
      }
    }

    // Fallback for local testing
    const local = localStorage.getItem(`promptbazaar_screenshot_${path}`);
    if (local) return local;

    return null;
  },

  // ==========================================
  // MEDIA UPLOAD & STORAGE TRACKER (PHASE 3)
  // ==========================================

  // Upload compressed image or preview video to Supabase Storage (bucket: 'media')
  async uploadMediaFile(file: File, bucket = 'media'): Promise<string> {
    const fileBytes = file.size;

    // Track storage bytes in local ledger
    const currentBytes = Number(localStorage.getItem('promptbazaar_storage_ledger_bytes') || '142606336'); // default ~136 MB initial seed media
    localStorage.setItem('promptbazaar_storage_ledger_bytes', String(currentBytes + fileBytes));

    if (isSupabaseConfigured && supabase) {
      try {
        const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(cleanName, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || 'image/jpeg',
          });

        if (error) {
          console.error('[Supabase Storage Error] uploadMediaFile:', error);
          const isRls = error.message?.toLowerCase().includes('policy') || error.message?.toLowerCase().includes('row-level security') || (error as any).statusCode === 403;
          if (isRls) {
            throw new Error('Supabase "media" bucket storage policy allow nahi hai. Kripya Admin Panel me "SQL Setup" se updated storage migration run karein aur verify karein ki aap admin account se logged in hain.');
          }
          throw new Error(`Media upload fail hua (${bucket}): ${error.message}`);
        }

        if (data) {
          const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

          if (publicData?.publicUrl) {
            return publicData.publicUrl;
          }
        }
      } catch (err: any) {
        console.error('Storage upload failed:', err);
        throw err;
      }
    }

    // Fallback ONLY when Supabase is not configured (offline demo mode)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Get Storage Usage (Used vs 1 GB limit)
  async getStorageUsage(): Promise<{ usedBytes: number; usedMB: number; totalMB: number; percentage: number; isWarning: boolean }> {
    const TOTAL_MB = 1024; // 1 GB
    let usedBytes = Number(localStorage.getItem('promptbazaar_storage_ledger_bytes') || '142606336');

    if (isSupabaseConfigured && supabase) {
      try {
        // Query storage objects in 'media' and 'payment_proofs'
        const { data } = await supabase.storage.from('media').list('', { limit: 100 });
        if (data && data.length > 0) {
          const bucketBytes = data.reduce((acc, item) => acc + (item.metadata?.size || 350000), 0);
          if (bucketBytes > 0) {
            usedBytes = bucketBytes;
          }
        }
      } catch (err) {
        console.warn('Storage usage fetch failed from Supabase:', err);
      }
    }

    const usedMB = Number((usedBytes / (1024 * 1024)).toFixed(1));
    const percentage = Number(Math.min(100, (usedMB / TOTAL_MB) * 100).toFixed(1));
    const isWarning = percentage >= 80;

    return {
      usedBytes,
      usedMB,
      totalMB: TOTAL_MB,
      percentage,
      isWarning,
    };
  },

  // Toggle Photo Featured
  async togglePhotoFeatured(id: string, isFeatured: boolean): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('photo_items')
          .update({ is_featured: isFeatured })
          .eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase toggle photo featured error:', err);
      }
    }

    const photos: PhotoItem[] = JSON.parse(localStorage.getItem(LS_PHOTOS_KEY) || '[]');
    const target = photos.find((p) => p.id === id);
    if (target) {
      target.is_featured = isFeatured;
      localStorage.setItem(LS_PHOTOS_KEY, JSON.stringify(photos));
      return true;
    }
    return false;
  },

  // Toggle Video Featured
  async toggleVideoFeatured(id: string, isFeatured: boolean): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('video_items')
          .update({ is_featured: isFeatured })
          .eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase toggle video featured error:', err);
      }
    }

    const videos: VideoItem[] = JSON.parse(localStorage.getItem(LS_VIDEOS_KEY) || '[]');
    const target = videos.find((v) => v.id === id);
    if (target) {
      target.is_featured = isFeatured;
      localStorage.setItem(LS_VIDEOS_KEY, JSON.stringify(videos));
      return true;
    }
    return false;
  },

  // Toggle Photo Publish / Unpublish
  async togglePhotoPublish(id: string, isPublished: boolean): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('photo_items')
          .update({ is_published: isPublished })
          .eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase toggle photo publish error:', err);
      }
    }

    const photos: PhotoItem[] = JSON.parse(localStorage.getItem(LS_PHOTOS_KEY) || '[]');
    const target = photos.find((p) => p.id === id);
    if (target) {
      target.is_published = isPublished;
      localStorage.setItem(LS_PHOTOS_KEY, JSON.stringify(photos));
      return true;
    }
    return false;
  },

  // Toggle Video Publish / Unpublish
  async toggleVideoPublish(id: string, isPublished: boolean): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('video_items')
          .update({ is_published: isPublished })
          .eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.warn('Supabase toggle video publish error:', err);
      }
    }

    const videos: VideoItem[] = JSON.parse(localStorage.getItem(LS_VIDEOS_KEY) || '[]');
    const target = videos.find((v) => v.id === id);
    if (target) {
      target.is_published = isPublished;
      localStorage.setItem(LS_VIDEOS_KEY, JSON.stringify(videos));
      return true;
    }
    return false;
  },

  // Reorder Photo Items
  async reorderPhotoItems(orderedItems: PhotoItem[]): Promise<boolean> {
    const updated = orderedItems.map((item, idx) => ({ ...item, display_order: idx }));

    if (isSupabaseConfigured && supabase) {
      try {
        for (const item of updated) {
          await supabase.from('photo_items').update({ display_order: item.display_order }).eq('id', item.id);
        }
        return true;
      } catch (err) {
        console.warn('Supabase reorder photos error:', err);
      }
    }

    localStorage.setItem(LS_PHOTOS_KEY, JSON.stringify(updated));
    return true;
  },

  // Reorder Video Items
  async reorderVideoItems(orderedItems: VideoItem[]): Promise<boolean> {
    const updated = orderedItems.map((item, idx) => ({ ...item, display_order: idx }));

    if (isSupabaseConfigured && supabase) {
      try {
        for (const item of updated) {
          await supabase.from('video_items').update({ display_order: item.display_order }).eq('id', item.id);
        }
        return true;
      } catch (err) {
        console.warn('Supabase reorder videos error:', err);
      }
    }

    localStorage.setItem(LS_VIDEOS_KEY, JSON.stringify(updated));
    return true;
  },

  // Custom Categories Store
  getCustomCategories(): string[] {
    try {
      const saved = localStorage.getItem('promptbazaar_custom_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  saveCustomCategory(cat: string): string[] {
    const existing = dataApi.getCustomCategories();
    const trimmed = cat.trim();
    if (trimmed && !existing.includes(trimmed)) {
      const next = [...existing, trimmed];
      localStorage.setItem('promptbazaar_custom_categories', JSON.stringify(next));
      return next;
    }
    return existing;
  },
};
