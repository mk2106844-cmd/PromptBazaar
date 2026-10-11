/**
 * PromptBazaar Configuration
 * All key app constants in one place so you can easily customize them!
 */

export const APP_CONFIG = {
  // Application Name - change here to rename anywhere in the app
  name: 'PromptBazaar',
  tagline: 'Bharat Ka Apna AI Photo Prompts & Video Ads Bazaar',
  taglineEnglish: 'India\'s AI Marketplace for Photo Prompts & Video Ads',

  // Admin Configuration
  // Add your email here. Users with this email will get Admin access.
  adminEmails: [
    'mk2106844@gmail.com',
    'admin@promptbazaar.com',
  ],

  // Manual UPI Payment Details (Phase 1)
  upi: {
    id: '9718936211@ibl', // Default UPI ID
    payeeName: 'PromptBazaar',
    currency: 'INR',
    // Verification timeframe shown to users
    verificationTimeEstimate: '10 - 15 minutes',
  },

  // WhatsApp Contact for Support & Custom Ads
  whatsapp: {
    number: '+919718936211', // Default WhatsApp number
    customAdMessage: 'Namaste! Mujhe apne business/event ke liye Custom Video Ad banwana hai. Details share kar sakte hain?',
    supportMessage: 'Namaste! Mujhe PromptBazaar order ke regarding help chahiye.',
  },

  // Available Categories for Photo Editing Prompts
  photoCategories: [
    'All',
    'Trending',
    'Wedding / Dulhan',
    'Cinematic Portrait',
    'Instagram Reel Cover',
    'Festival & Puja',
    'Cyberpunk & 3D',
    'Bolly Glamour',
    'Shop & Product',
  ] as const,

  // Video Categories (for future & placeholder)
  videoCategories: [
    'Shop / Dukaan',
    'DJ & Music Event',
    'Clinic & Hospital',
    'CSC & Cyber Cafe',
    'Festival Offer',
    'Reel Promo',
  ] as const,

  // Disclaimer Note
  disclaimer: 'Dhyan dein: Bina ijazat kisi doosre vyakti ki photo upload ya generate karna sakht mana hai. Respect individual privacy.',
};

export type PhotoCategory = typeof APP_CONFIG.photoCategories[number];
export type VideoCategory = typeof APP_CONFIG.videoCategories[number];
