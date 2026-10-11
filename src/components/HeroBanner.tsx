import React from 'react';
import { Sparkles, Camera, Video, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { APP_CONFIG } from '../config';

interface HeroBannerProps {
  onSelectPhotos: () => void;
  onSelectVideos: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onSelectPhotos,
  onSelectVideos,
}) => {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden pt-6 pb-8 px-3 sm:px-4 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-950 w-full max-w-full">
      {/* Background Soft Neon-Lime Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[340px] sm:w-[540px] h-64 bg-gradient-to-b from-lime-400/25 via-lime-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-24 -left-20 w-48 h-48 bg-emerald-500/10 blur-2xl pointer-events-none rounded-full" />
      <div className="absolute top-24 -right-20 w-48 h-48 bg-lime-500/10 blur-2xl pointer-events-none rounded-full" />

      <div className="max-w-3xl mx-auto relative z-10 text-center">
        {/* Quality Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 text-[11px] sm:text-xs font-bold mb-3 animate-pulse">
          <Zap className="w-3.5 h-3.5 fill-lime-400" />
          <span>{t('heroBadge')}</span>
        </div>

        {/* Main Headline (text-3xl on mobile, responsive, break-words) */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.15] mb-3 break-words">
          {APP_CONFIG.name}: <span className="text-lime-400 underline decoration-lime-500/40 underline-offset-4">{t('heroTitle')}</span>
        </h1>

        <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto mb-5 leading-relaxed px-1">
          {t('heroSub')}
        </p>

        {/* Visual Decorative Mosaic of 3 Sample Prompt Images */}
        <div className="relative my-6 max-w-md mx-auto px-2">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 items-center">
            {/* Card 1: Left */}
            <div className="relative group rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-lg transform -rotate-2 hover:rotate-0 transition-transform duration-300">
              <img
                src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80"
                alt="Royal Groom Portrait Prompt"
                className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-1.5 left-1.5 right-1.5 text-left">
                <span className="text-[9px] font-black text-lime-300 uppercase tracking-wider block truncate">
                  Royal Groom
                </span>
                <span className="text-[8px] text-zinc-300 font-semibold block truncate">Midjourney 8K</span>
              </div>
            </div>

            {/* Card 2: Center (Elevated with neon lime ring) */}
            <div className="relative group rounded-xl sm:rounded-2xl overflow-hidden border-2 border-lime-400/80 bg-zinc-900 shadow-xl shadow-lime-400/20 transform scale-105 z-10 transition-transform duration-300">
              <img
                src="https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=400&q=80"
                alt="Varanasi Aarti 3D Prompt"
                className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
              <div className="absolute top-1.5 right-1.5">
                <span className="px-1.5 py-0.5 rounded-full bg-lime-400 text-zinc-950 font-black text-[8px] shadow">
                  ₹29
                </span>
              </div>
              <div className="absolute bottom-1.5 left-1.5 right-1.5 text-left">
                <span className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-wider block truncate">
                  Ganga Aarti 3D
                </span>
                <span className="text-[8px] text-lime-400 font-semibold block truncate">Trending #1</span>
              </div>
            </div>

            {/* Card 3: Right */}
            <div className="relative group rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <img
                src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80"
                alt="Cyberpunk Auto Prompt"
                className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-1.5 left-1.5 right-1.5 text-left">
                <span className="text-[9px] font-black text-cyan-300 uppercase tracking-wider block truncate">
                  Cyber Mumbai
                </span>
                <span className="text-[8px] text-zinc-300 font-semibold block truncate">Flux 1.1 Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Separate Big Buttons (stacked full-width on mobile) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
          {/* Button 1: Photo Editing Prompts */}
          <button
            onClick={onSelectPhotos}
            className="flex-1 group relative flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-lime-400 to-lime-500 text-zinc-950 font-extrabold text-sm sm:text-base shadow-lg shadow-lime-400/25 hover:shadow-lime-400/40 active:scale-95 transition-all text-left w-full"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-950/20 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-950" />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-black tracking-tight leading-snug">Photo Editing</span>
                <span className="text-[11px] font-semibold text-zinc-800">Viral Prompts</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Button 2: Video Ads */}
          <button
            onClick={onSelectVideos}
            className="flex-1 group relative flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-zinc-900 border-2 border-zinc-700/80 hover:border-lime-400/60 text-white font-bold text-sm sm:text-base hover:bg-zinc-800/80 active:scale-95 transition-all text-left w-full"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 sm:w-6 sm:h-6 text-lime-400" />
              </div>
              <div>
                <span className="block text-xs sm:text-sm font-bold tracking-tight leading-snug">Video Ads</span>
                <span className="text-[11px] text-lime-400 font-semibold">Custom Ads & Clips</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 group-hover:text-lime-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>

        {/* Feature / Trust Badges (wrap into 2-col grid or flexible row so never get cut off) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-3 mt-5 max-w-lg mx-auto text-[11px] sm:text-xs text-zinc-300 font-semibold px-2">
          <span className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-zinc-200">
            <ShieldCheck className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            <span className="truncate">Tested MJ / Flux</span>
          </span>

          <span className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-zinc-200">
            <span className="text-lime-400 font-black text-xs shrink-0">₹</span>
            <span className="truncate">Instant UPI Unlock</span>
          </span>

          <span className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-zinc-200">
            <Sparkles className="w-3.5 h-3.5 text-lime-400 shrink-0" />
            <span className="truncate">Full Hindi Prompts</span>
          </span>
        </div>
      </div>
    </section>
  );
};
