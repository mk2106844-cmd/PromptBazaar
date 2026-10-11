import React, { useState } from 'react';
import { Play, Copy, Check, Lock, Unlock, Sparkles, Tag, Clock, Video, Film, ExternalLink } from 'lucide-react';
import { VideoItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface VideoCardProps {
  item: VideoItem;
  isUnlocked?: boolean;
  unlockedSecretContent?: string | null;
  onUnlockClick: (item: VideoItem) => void;
  onCopySuccess: (text: string) => void;
  onPlayPreview?: (item: VideoItem) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  item,
  isUnlocked = false,
  unlockedSecretContent,
  onUnlockClick,
  onCopySuccess,
  onPlayPreview,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  const displayableContent = !item.is_paid
    ? item.free_content
    : isUnlocked
    ? unlockedSecretContent
    : null;

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopySuccess(text);
    setTimeout(() => setCopied(false), 2200);
  };

  const isPromptType = item.item_type === 'prompt';

  return (
    <div className="group bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden hover:border-lime-500/50 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-lime-950/20 active:scale-[0.99] hover:-translate-y-1 flex flex-col w-full max-w-full">
      {/* 1. VIDEO THUMBNAIL / PREVIEW ON TOP */}
      <div 
        onClick={() => onPlayPreview && onPlayPreview(item)}
        className="relative aspect-[16/10] bg-zinc-950 overflow-hidden cursor-pointer"
      >
        {/* Skeleton loader */}
        {!thumbnailLoaded && (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
            <Video className="w-6 h-6 text-zinc-600 animate-spin" />
          </div>
        )}

        <img
          src={item.thumbnail_url}
          alt={item.title}
          loading="lazy"
          onLoad={() => setThumbnailLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            thumbnailLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/40 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Category Chip */}
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-zinc-950/85 backdrop-blur-md text-zinc-300 border border-zinc-700/60 shadow-sm">
            <Tag className="w-3 h-3 text-lime-400" />
            {item.category}
          </span>

          {/* Price / Unlocked Badge */}
          {item.is_paid ? (
            <span
              className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full shadow-md border ${
                isUnlocked
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                  : 'bg-lime-400 text-zinc-950 border-lime-300 shadow-lime-400/20'
              }`}
            >
              {isUnlocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  UNLOCKED
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  ₹{item.price}
                </>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500 text-zinc-950 border border-emerald-300 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              {t('badgeFree')}
            </span>
          )}
        </div>

        {/* Play Icon Overlay / Duration Bar */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-zinc-950/70 border border-white/20 backdrop-blur-sm flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-lime-400 group-hover:text-zinc-950 transition-all duration-300 shadow-xl">
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>
        </div>

        {/* Bottom Badges on Image (Duration + Item Type) */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950/85 backdrop-blur-md text-zinc-300 font-mono font-semibold border border-zinc-800">
            <Clock className="w-3 h-3 text-lime-400" />
            {item.duration || '0:30'}
          </span>

          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
            isPromptType
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          }`}>
            {isPromptType ? (
              <>
                <Sparkles className="w-3 h-3 text-cyan-400" />
                AI Video Prompt
              </>
            ) : (
              <>
                <Film className="w-3 h-3 text-purple-400" />
                Ready Video Reel
              </>
            )}
          </span>
        </div>
      </div>

      {/* 2. VIDEO DETAILS & PROMPT/CONTENT BELOW */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        {/* Title & Description */}
        <div>
          <h3 className="text-base font-bold text-white leading-snug group-hover:text-lime-300 transition-colors">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Content Section */}
        <div>
          {/* CASE A: FREE VIDEO ITEM -> Content visible + Copy/Access button */}
          {!item.is_paid && (
            <div className="space-y-2.5">
              <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 text-xs text-zinc-300 font-mono leading-relaxed relative max-h-32 overflow-y-auto select-all">
                {item.free_content || 'Free video ad assets ready.'}
              </div>

              <button
                onClick={() => handleCopy(item.free_content || '')}
                className={`w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  copied
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-lime-400 hover:text-lime-300 border border-zinc-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Copy Ho Gaya! ✨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{isPromptType ? 'Copy Video Prompt' : 'Copy Download / Template Link'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* CASE B: PAID ITEM & UNLOCKED -> Full secret visible + Copy button */}
          {item.is_paid && isUnlocked && (
            <div className="space-y-2.5">
              <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3 text-xs text-emerald-200 font-mono leading-relaxed relative max-h-32 overflow-y-auto select-all">
                {displayableContent || 'Video prompt unlocked! Ready to use.'}
              </div>

              <button
                onClick={() => handleCopy(displayableContent || '')}
                className={`w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  copied
                    ? 'bg-emerald-400 text-zinc-950 shadow-md'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Copy Ho Gaya! ✨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Unlocked Video Content</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* CASE C: PAID ITEM & LOCKED -> Secret text is NOT sent! Only Unlock for ₹XX shows */}
          {item.is_paid && !isUnlocked && (
            <div className="space-y-2.5">
              {/* Blurred locked notice - No secret text sent in DOM! */}
              <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/80 text-xs text-zinc-500 flex items-center gap-2">
                <Lock className="w-4 h-4 text-lime-400 shrink-0" />
                <span className="text-[11px] leading-tight">
                  🔒 Premium {isPromptType ? 'Video Prompt' : 'Ready Reel File'} Locked Hai. Unlock hone ke baad pura access milega.
                </span>
              </div>

              {/* Big thumb-friendly Unlock button */}
              <button
                onClick={() => onUnlockClick(item)}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-300 hover:to-lime-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 hover:shadow-lime-400/35 active:scale-95 transition-all"
              >
                <Unlock className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {t('unlockBtn')}
                  {item.price}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
