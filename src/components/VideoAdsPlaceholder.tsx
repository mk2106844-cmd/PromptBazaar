import React from 'react';
import { Video, MessageCircle, Sparkles, Clock, CheckCircle2, Store, Music, Stethoscope, Laptop, Gift } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { useAppSettings } from '../lib/settings';

export const VideoAdsPlaceholder: React.FC = () => {
  const { t } = useLanguage();
  const settings = useAppSettings();

  const currentWhatsapp = settings.whatsappNumber || APP_CONFIG.whatsapp.number;
  const whatsappUrl = `https://wa.me/${currentWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    APP_CONFIG.whatsapp.customAdMessage
  )}`;

  const videoCategories = [
    { name: 'Shop / Dukaan Ads', icon: Store, desc: 'Kirana, Cloth store & Retail offer reels', color: 'from-amber-500/20 to-orange-500/20' },
    { name: 'DJ & Sound Events', icon: Music, desc: 'Bass booster dynamic party posters & teasers', color: 'from-purple-500/20 to-pink-500/20' },
    { name: 'Clinic & Hospital', icon: Stethoscope, desc: 'Doctor appointment & medical clinic promos', color: 'from-cyan-500/20 to-blue-500/20' },
    { name: 'CSC & Cyber Cafe', icon: Laptop, desc: 'Aadhaar, PAN card, Online form notices', color: 'from-emerald-500/20 to-teal-500/20' },
    { name: 'Festival & Sale Promo', icon: Gift, desc: 'Diwali, Eid, Navratri & New Year reels', color: 'from-lime-500/20 to-emerald-500/20' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="text-center bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 rounded-3xl border border-zinc-800 relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Jaldi Aa Raha Hai (Coming Soon)</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          {t('videoAdsTitle')}
        </h2>

        <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed mb-6">
          {t('videoAdsSub')}
        </p>

        {/* Big "Custom Ad Banwao" Button (opens WhatsApp) */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all w-full sm:w-auto"
        >
          <MessageCircle className="w-5 h-5 fill-white" />
          <span>{t('customAdBtn')}</span>
        </a>

        <p className="text-[11px] text-zinc-500 mt-2">
          WhatsApp number: {APP_CONFIG.whatsapp.number} • Delivery within 24 hours
        </p>
      </div>

      {/* Categories Preview */}
      <div>
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-3 px-1">
          Supported Ad Types (Categories)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {videoCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3 hover:border-zinc-700 transition-colors"
              >
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${cat.color} text-lime-400 border border-zinc-700/60`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {cat.name}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    {cat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Teasers */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
        <h4 className="text-xs font-bold text-lime-400 uppercase tracking-wider">
          Aane Wale Features:
        </h4>
        <ul className="text-xs text-zinc-300 space-y-1.5">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            <span>Ready-made 9:16 vertical reels for Instagram & WhatsApp Status.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            <span>AI Video Prompts for Runway Gen-3, Luma Dream Machine & Kling AI.</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            <span>Hindi Voiceover Scripts included in each prompt.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
