import React, { useState } from 'react';
import { Copy, Check, Lock, Unlock, Sparkles, Tag, Eye, Share2 } from 'lucide-react';
import { PhotoItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PhotoCardProps {
  item: PhotoItem;
  isUnlocked?: boolean;
  unlockedPromptText?: string | null;
  onUnlockClick: (item: PhotoItem) => void;
  onCopySuccess: (text: string) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  item,
  isUnlocked = false,
  unlockedPromptText,
  onUnlockClick,
  onCopySuccess,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Available prompt text to copy
  // For free items: item.free_prompt_text
  // For unlocked paid items: unlockedPromptText
  // For locked paid items: undefined! (Full security adherence)
  const displayablePrompt = !item.is_paid
    ? item.free_prompt_text
    : isUnlocked
    ? unlockedPromptText
    : null;

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopySuccess(text);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="group bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden hover:border-lime-500/50 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-lime-950/20 active:scale-[0.99] hover:-translate-y-1 flex flex-col w-full max-w-full">
      {/* 1. PHOTO ON TOP (Bigger rounded image with gradient overlay) */}
      <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-zinc-600 animate-spin" />
          </div>
        )}

        {/* Lazy loaded image */}
        <img
          src={item.image_url}
          alt={item.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Rich gradient overlay at the bottom of the image */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/25 to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Category Chip */}
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-zinc-950/85 backdrop-blur-md text-zinc-300 border border-zinc-700/60 shadow-sm">
            <Tag className="w-3 h-3 text-lime-400" />
            <span className="truncate max-w-[120px]">{item.category}</span>
          </span>

          {/* FREE / PAID Badge directly on image */}
          {item.is_paid ? (
            <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full shadow-md border backdrop-blur-md ${
              isUnlocked
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                : 'bg-lime-400 text-zinc-950 border-lime-300 shadow-lime-400/25'
            }`}>
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
            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500 text-zinc-950 border border-emerald-300 shadow-md backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              {t('badgeFree')}
            </span>
          )}
        </div>

        {/* Bottom Floating Quick Icon Button on the image */}
        <div className="absolute bottom-3 right-3 z-10">
          {item.is_paid && !isUnlocked ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnlockClick(item);
              }}
              title={`Unlock for ₹${item.price}`}
              className="w-9 h-9 rounded-full bg-lime-400 hover:bg-lime-300 text-zinc-950 flex items-center justify-center shadow-lg shadow-lime-400/30 active:scale-90 transition-all hover:scale-105"
            >
              <Unlock className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(displayablePrompt || item.free_prompt_text || '');
              }}
              title={copied ? 'Copied!' : 'Copy prompt'}
              className="w-9 h-9 rounded-full bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-700/80 text-lime-400 hover:text-lime-300 flex items-center justify-center shadow-lg active:scale-90 transition-all hover:scale-105 backdrop-blur-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* 2. PROMPT & DETAILS BELOW PHOTO (strictly required) */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3 min-w-0">
        {/* Title & Description */}
        <div>
          <h3 className="text-base font-bold text-white leading-snug group-hover:text-lime-300 transition-colors break-words">
            {item.title}
          </h3>
          {item.description && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        {/* Prompt Container */}
        <div>
          {/* CASE A: FREE ITEM -> Full prompt visible + Copy Prompt button */}
          {!item.is_paid && (
            <div className="space-y-2.5">
              <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 text-xs text-zinc-300 font-mono leading-relaxed relative max-h-32 overflow-y-auto select-all">
                {item.free_prompt_text || 'Prompt text ready.'}
              </div>

              <button
                onClick={() => handleCopy(item.free_prompt_text || '')}
                className={`w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  copied
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-lime-400 hover:text-lime-300 border border-zinc-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{t('promptCopied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{t('copyPromptBtn')}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* CASE B: PAID ITEM & UNLOCKED -> Full prompt visible + Copy Prompt button */}
          {item.is_paid && isUnlocked && (
            <div className="space-y-2.5">
              <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3 text-xs text-emerald-200 font-mono leading-relaxed relative max-h-32 overflow-y-auto select-all">
                {displayablePrompt || 'Prompt unlocked! Ready to copy.'}
              </div>

              <button
                onClick={() => handleCopy(displayablePrompt || '')}
                className={`w-full h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  copied
                    ? 'bg-emerald-400 text-zinc-950 shadow-md'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{t('promptCopied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Unlocked Prompt</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* CASE C: PAID ITEM & LOCKED -> Prompt text is NOT sent! Only Unlock for ₹XX shows */}
          {item.is_paid && !isUnlocked && (
            <div className="space-y-2.5">
              {/* Blurred locked representation - NO actual secret text in DOM! */}
              <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/80 text-xs text-zinc-500 flex items-center gap-2">
                <Lock className="w-4 h-4 text-lime-400 shrink-0" />
                <span className="text-[11px] leading-tight">
                  {t('lockedPromptNotice')}
                </span>
              </div>

              {/* Big thumb-friendly Unlock Button */}
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
