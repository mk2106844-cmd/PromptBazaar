export type ItemType = 'photo' | 'video';

export type OrderStatus = 'pending' | 'approved' | 'rejected';

export interface PhotoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  is_paid: boolean;
  price: number; // ₹ amount, 0 for free
  image_url: string;
  // Public prompt text: populated ONLY for FREE prompts.
  // For PAID prompts, this will be null/undefined on the public list.
  free_prompt_text?: string;
  is_published: boolean;
  is_featured?: boolean;
  display_order?: number;
  created_at: string;
  created_by?: string;
}

export interface PhotoSecret {
  photo_id: string;
  secret_prompt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  item_type: 'prompt' | 'ready_video';
  is_paid: boolean;
  price: number;
  thumbnail_url: string;
  video_url?: string;
  external_video_url?: string; // External full video link (Drive/YouTube)
  duration?: string;
  // Public content: populated ONLY for FREE video items (prompts/links).
  // For PAID videos, this is null/undefined on the public list.
  free_content?: string;
  is_published: boolean;
  is_featured?: boolean;
  display_order?: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  user_email: string;
  item_type: 'photo' | 'video';
  item_id: string;
  amount: number;
  upi_ref: string;
  screenshot_url?: string;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
  // Populated on join/fetch for convenience
  item_title?: string;
  item_image_url?: string;
  unlocked_secret?: string; // Revealed only when order status is approved
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  isAdmin?: boolean;
}
