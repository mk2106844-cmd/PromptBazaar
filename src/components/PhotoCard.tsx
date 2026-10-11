import React, { useState } from 'react';
import { Copy, Check, Lock, Unlock, Sparkles, Tag } from 'lucide-react';
import { PhotoItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PhotoCardProps {
  item: PhotoItem;
  isUnlocked?: boolean;
  unlockedPromptText?: string | null;
  onUnlockClick: (item: PhotoItem) => void;
  onCopySuccess: (text: string) => void;
  onCardClick?: (item: PhotoItem) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  item,
  isUnlocked = false,
  unlockedPromptText,
  onUnlockClick,
  onCopySuccess,
  onCardClick,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const displayablePrompt = !item.is_paid
    ? item.free_prompt_text
    : isUnlocked
    ? unlockedPromptText
    : null;

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopySuccess(text);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnlockClick(item);
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(item);
    } else if (item.is_paid && !isUnlocked) {
      onUnlockClick(item);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-lime-400/50 transition-all duration-200 active:scale-[0.98] flex flex-col w-full cursor-pointer shadow-sm hover:shadow-md"
    >
      {/* 1. COMPACT 4:5 IMAGE CONTAINER */}
      <div className="relative aspect-[4/5] bg-zinc-950 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-zinc-700 animate-spin" />
          </div>
        )}

        <img
          src={item.image_url}
          alt={item.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Gradient shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-black/30 pointer-events-none" />

        {/* Category Chip (Top-Left) */}
        <div className="absolute top-2 left-2 pointer-events-none">
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-zinc-950/85 backdrop-blur-md text-zinc-300 border border-zinc-800/80 truncate max-w-[85px] block">
            {item.category}
          </span>
        </div>

        {/* Price / Free Badge (Top-Right) */}
        <div className="absolute top-2 right-2 pointer-events-none">
          {item.is_paid ? (
            <span
              className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm backdrop-blur-md ${
                isUnlocked
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-lime-400 text-zinc-950'
              }`}
            >
              {isUnlocked ? (
                <>
                  <Unlock className="w-2.5 h-2.5" />
                  UNLOCKED
                </>
              ) : (
                <>
                  <Lock className="w-2.5 h-2.5" />
                  ₹{item.price}
                </>
              )}
            </span>
          ) : (
            <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500 text-zinc-950 shadow-sm flex items-center gap-0.5 backdrop-blur-md">
              <Sparkles className="w-2.5 h-2.5" />
              FREE
            </span>
          )}
        </div>
      </div>

      {/* 2. CARD FOOTER: TITLE & ACTION BUTTON */}
      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between gap-1.5 min-w-0 text-left">
        <h3 className="text-xs sm:text-[13px] font-bold text-white line-clamp-2 leading-tight group-hover:text-lime-300 transition-colors">
          {item.title}
        </h3>

        {/* Quick Action Button */}
        <div className="pt-0.5 flex items-center justify-between gap-1">
          {item.is_paid && !isUnlocked ? (
            <button
              onClick={handleUnlock}
              title={`Unlock for ₹${item.price}`}
              className="w-full py-1.5 px-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
            >
              <Unlock className="w-3 h-3 stroke-[2.5]" />
              <span>Unlock ₹{item.price}</span>
            </button>
          ) : (
            <button
              onClick={(e) => handleCopy(e, displayablePrompt || item.free_prompt_text || '')}
              title={copied ? 'Copied!' : 'Copy prompt'}
              className={`w-full py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-lime-400 border border-zinc-700/60'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
