import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'hinglish' | 'english' | 'hindi';

interface Translations {
  [key: string]: {
    hinglish: string;
    english: string;
    hindi: string;
  };
}

export const DICTIONARY: Translations = {
  // Navigation & Tabs
  tabHome: {
    hinglish: 'Home',
    english: 'Home',
    hindi: 'होम',
  },
  tabPhotoPrompts: {
    hinglish: 'Photo Prompts',
    english: 'Photo Prompts',
    hindi: 'फोटो प्रॉम्प्ट्स',
  },
  tabVideoAds: {
    hinglish: 'Video Ads',
    english: 'Video Ads',
    hindi: 'वीडियो ऐड्स',
  },
  tabMyUnlocks: {
    hinglish: 'My Unlocks',
    english: 'My Unlocks',
    hindi: 'मेरे अनलॉक्स',
  },
  tabAdmin: {
    hinglish: 'Admin Panel',
    english: 'Admin Panel',
    hindi: 'एडमिन पैनल',
  },

  // Hero Section
  heroBadge: {
    hinglish: '🔥 100% Tested Indian AI Prompts',
    english: '🔥 100% Tested Indian AI Prompts',
    hindi: '🔥 100% परीक्षित भारतीय AI प्रॉम्प्ट्स',
  },
  heroTitle: {
    hinglish: 'Trending AI Photo Prompts & Video Ads',
    english: 'Trending AI Photo Prompts & Video Ads',
    hindi: 'ट्रेंडिंग AI फोटो प्रॉम्प्ट्स और वीडियो ऐड्स',
  },
  heroSub: {
    hinglish: 'Midjourney, Bing Image Creator aur Flux ke liye ready-to-use viral prompts. Instant copy karo ya ₹19 se unlock karo.',
    english: 'Ready-to-use viral prompts for Midjourney, Bing & Flux. Copy for free or unlock premium prompts starting at ₹19.',
    hindi: 'मिडजर्नी, बिंग और फ्लक्स के लिए तैयार वायरल प्रॉम्प्ट्स। फ्री में कॉपी करें या ₹19 से अनलॉक करें।',
  },
  heroBtnPhotos: {
    hinglish: '📸 Photo Editing Prompts Dekho',
    english: '📸 Browse Photo Editing Prompts',
    hindi: '📸 फोटो एडिटिंग प्रॉम्प्ट्स देखें',
  },
  heroBtnVideos: {
    hinglish: '🎬 Video Ads (Jaldi Aa Raha Hai)',
    english: '🎬 Video Ads (Coming Soon)',
    hindi: '🎬 वीडियो ऐड्स (जल्द आ रहा है)',
  },

  // Card items
  badgeFree: {
    hinglish: 'FREE',
    english: 'FREE',
    hindi: 'मुफ़्त',
  },
  badgePaid: {
    hinglish: 'PAID',
    english: 'PAID',
    hindi: 'पेड',
  },
  copyPromptBtn: {
    hinglish: 'Copy Prompt',
    english: 'Copy Prompt',
    hindi: 'प्रॉम्प्ट कॉपी करें',
  },
  promptCopied: {
    hinglish: 'Prompt Copy Ho Gaya! ✨',
    english: 'Prompt Copied! ✨',
    hindi: 'प्रॉम्प्ट कॉपी हो गया! ✨',
  },
  unlockBtn: {
    hinglish: 'Unlock for ₹',
    english: 'Unlock for ₹',
    hindi: '₹ में अनलॉक करें: ',
  },
  lockedPromptNotice: {
    hinglish: '🔒 Premium Prompt Locked Hai. Unlock karne ke baad pura text yahan show hoga.',
    english: '🔒 Premium prompt locked. Full text will be revealed immediately after unlock.',
    hindi: '🔒 प्रीमियम प्रॉम्प्ट लॉक है। अनलॉक के बाद पूरा टेक्स्ट यहाँ दिखेगा।',
  },

  // Filters
  filterAll: {
    hinglish: 'Sabhi',
    english: 'All',
    hindi: 'सभी',
  },
  filterFree: {
    hinglish: 'Free Prompts',
    english: 'Free Prompts',
    hindi: 'फ्री प्रॉम्प्ट्स',
  },
  filterPaid: {
    hinglish: 'Paid Prompts',
    english: 'Paid Prompts',
    hindi: 'पेड प्रॉम्प्ट्स',
  },
  searchPlaceholder: {
    hinglish: 'Prompts search karein (Wedding, Festive, Cyberpunk...)',
    english: 'Search prompts (Wedding, Festive, Cyberpunk...)',
    hindi: 'प्रॉम्प्ट खोजें (शादी, त्यौहार, साइबरपंक...)',
  },

  // Video Ads Page
  videoAdsTitle: {
    hinglish: '🎬 High-Converting Video Ads',
    english: '🎬 High-Converting Video Ads',
    hindi: '🎬 हाई-कन्वर्टिंग वीडियो ऐड्स',
  },
  videoAdsSub: {
    hinglish: 'Dukaan, DJ events, clinic aur festivals ke liye ready video templates aur AI video prompts.',
    english: 'Ready video templates and AI prompts for shops, DJ events, clinics, and festivals.',
    hindi: 'दुकान, डीजे इवेंट्स, क्लिनिक और त्योहारों के लिए तैयार वीडियो टेम्पलेट्स।',
  },
  customAdBtn: {
    hinglish: '💬 Custom Ad Banwao (WhatsApp)',
    english: '💬 Order Custom Ad (WhatsApp)',
    hindi: '💬 कस्टम ऐड बनवाओ (व्हाट्सएप)',
  },

  // Purchase modal
  unlockModalTitle: {
    hinglish: 'Instant UPI Unlock',
    english: 'Instant UPI Unlock',
    hindi: 'त्वरित UPI अनलॉक',
  },
  step1Pay: {
    hinglish: '1. QR Code scan karke ya UPI ID par payment karein',
    english: '1. Scan QR code or pay to the UPI ID',
    hindi: '1. QR कोड स्कैन करें या UPI ID पर भुगतान करें',
  },
  copyUpiId: {
    hinglish: 'UPI ID Copy Karein',
    english: 'Copy UPI ID',
    hindi: 'UPI ID कॉपी करें',
  },
  copied: {
    hinglish: 'Copy Ho Gaya!',
    english: 'Copied!',
    hindi: 'कॉपी हो गया!',
  },
  step2Proof: {
    hinglish: '2. Payment ka screenshot upload karein & UTR number dalein',
    english: '2. Upload payment screenshot & enter UTR/Ref number',
    hindi: '2. पेमेंट स्क्रीनशॉट अपलोड करें और UTR नंबर दर्ज करें',
  },
  utrPlaceholder: {
    hinglish: '12-digit UPI Ref / UTR No. (eg: 4092xxxxxxxx)',
    english: '12-digit UPI Ref / UTR No.',
    hindi: '12-अंकीय UPI Ref / UTR नंबर',
  },
  submitPaymentBtn: {
    hinglish: 'Payment Bheja - Submit Karein',
    english: 'Submitted Payment - Verify Now',
    hindi: 'भुगतान भेजा - सबमिट करें',
  },
  uploadProofLabel: {
    hinglish: 'Payment Screenshot Chunye',
    english: 'Choose Payment Screenshot',
    hindi: 'पेमेंट स्क्रीनशॉट चुनें',
  },

  // My Unlocks
  myUnlocksTitle: {
    hinglish: 'Mere Unlocks & Orders',
    english: 'My Unlocks & Orders',
    hindi: 'मेरे अनलॉक्स और ऑर्डर्स',
  },
  statusPending: {
    hinglish: '⏳ Pending Verification (10-15 Min)',
    english: '⏳ Verification Pending (10-15 Min)',
    hindi: '⏳ सत्यापन प्रगति पर है (10-15 मिनट)',
  },
  statusApproved: {
    hinglish: '✅ Unlocked & Ready!',
    english: '✅ Unlocked & Ready!',
    hindi: '✅ अनलॉक हो गया!',
  },
  statusRejected: {
    hinglish: '❌ Payment Rejected',
    english: '❌ Payment Rejected',
    hindi: '❌ भुगतान अस्वीकृत',
  },
  noUnlocksYet: {
    hinglish: 'Abhi tak koi unlock nahi kiya hai. Trending photo prompts dekhein!',
    english: 'No unlocked prompts yet. Explore trending photo prompts!',
    hindi: 'अभी तक कोई प्रॉम्प्ट अनलॉक नहीं किया गया है। ट्रेंडिंग फोटो देखें!',
  },

  // Legal & Disclaimer
  disclaimerBanner: {
    hinglish: '⚠️ Dhyan Dein: Kisi doosre vyakti ki photo bina anumati upload ya generate karna sakht mana hai.',
    english: '⚠️ Note: Uploading or generating photos of others without explicit permission is strictly prohibited.',
    hindi: '⚠️ ध्यान दें: बिना अनुमति किसी अन्य व्यक्ति की फोटो अपलोड या जेनरेट करना सख्त मना है।',
  },

  // Auth
  loginTitle: {
    hinglish: 'Creator Login',
    english: 'Creator Login',
    hindi: 'क्रिएटर लॉगिन',
  },
  loginSub: {
    hinglish: 'Apne unlocked prompts aur orders save karne ke liye sign in karein.',
    english: 'Sign in to access your unlocked prompts and purchase history.',
    hindi: 'अपने अनलॉक किए गए प्रॉम्प्ट्स और ऑर्डर्स देखने के लिए साइन इन करें।',
  },
  continueWithGoogle: {
    hinglish: 'Google se Sign In karein',
    english: 'Continue with Google',
    hindi: 'Google से साइन इन करें',
  },
  continueWithEmail: {
    hinglish: 'Email se Continue karein',
    english: 'Continue with Email',
    hindi: 'ईमेल से जारी रखें',
  },
  signOut: {
    hinglish: 'Sign Out',
    english: 'Sign Out',
    hindi: 'लॉग आउट',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof DICTIONARY) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'hinglish',
  setLanguage: () => {},
  t: (key) => DICTIONARY[key]?.hinglish || String(key),
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('promptbazaar_lang') as Language) || 'hinglish';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('promptbazaar_lang', lang);
  };

  const t = (key: keyof typeof DICTIONARY): string => {
    if (!DICTIONARY[key]) return String(key);
    return DICTIONARY[key][language] || DICTIONARY[key].hinglish || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
