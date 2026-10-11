import React, { useState } from 'react';
import { X, ArrowLeft, Copy, Check, Lock, Unlock, Sparkles, Tag, Share2, ShieldCheck, Zap } from 'lucide-react';
import { PhotoItem } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PromptDetailModalProps {
  item: PhotoItem | null;
  isOpen: boolean;
  onClose: () => void;
  isUnlocked?: boolean;
  unlockedPromptText?: string | null;
  onUnlockClick: (item: PhotoItem) => void;
  onCopySuccess: (text: string) => void;
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  isUnlocked = false,
  unlockedPromptText,
  onUnlockClick,
  onCopySuccess,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Check out this AI Prompt on PromptBazaar: ${item.title}`,
          url: window.location.href,
        });
      } catch {
        // Share dismissed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      onCopySuccess('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Mobile-first Modal / Bottom Sheet */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-zinc-950 sm:rounded-3xl rounded-t-3xl border border-zinc-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10 animate-slideUp">
        {/* Android App Bar / Header */}
        <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-md px-3.5 py-3 border-b border-zinc-800/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors active:scale-90"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span className="text-xs font-bold text-zinc-400 truncate max-w-[180px]">
            {item.category}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors active:scale-90"
              title="Share Prompt"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors active:scale-90"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Main Visual Image */}
          <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-lg">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

            {/* Badges on image */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-zinc-300 border border-zinc-700/60 flex items-center gap-1">
                <Tag className="w-3 h-3 text-lime-400" />
                {item.category}
              </span>
            </div>

            <div className="absolute top-3 right-3">
              {item.is_paid ? (
                <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-md flex items-center gap-1 backdrop-blur-md ${
                  isUnlocked
                    ? 'bg-emerald-500 text-zinc-950 border-emerald-400'
                    : 'bg-lime-400 text-zinc-950 border-lime-300'
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
                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500 text-zinc-950 border border-emerald-300 shadow-md flex items-center gap-1 backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  FREE
                </span>
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-3 text-left">
              <h2 className="text-lg font-black text-white leading-tight drop-shadow-md">
                {item.title}
              </h2>
            </div>
          </div>

          {/* Prompt Description */}
          {item.description && (
            <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed">
              <p>{item.description}</p>
            </div>
          )}

          {/* PROMPT CONTENT SECTION */}
          {/* CASE A: FREE ITEM OR UNLOCKED PAID ITEM */}
          {(!item.is_paid || isUnlocked) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                  <Sparkles className="w-4 h-4 text-lime-400" />
                  <span>Full AI Prompt</span>
                </div>
                <span className="text-[10px] text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full border border-lime-400/20 font-bold">
                  Ready to Use
                </span>
              </div>

              {/* Prompt Box */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 leading-relaxed select-all whitespace-pre-wrap max-h-56 overflow-y-auto">
                {displayablePrompt || item.free_prompt_text || 'Prompt text ready.'}
              </div>

              {/* Copy Prompt CTA Button */}
              <button
                onClick={() => handleCopy(displayablePrompt || item.free_prompt_text || '')}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                  copied
                    ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/25'
                    : 'bg-lime-400 hover:bg-lime-300 text-zinc-950 shadow-lime-400/25'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Full Prompt</span>
                  </>
                )}
              </button>

              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-[11px] text-zinc-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-lime-400 shrink-0" />
                <span>Midjourney, Flux ya Bing Image Creator me paste karein.</span>
              </div>
            </div>
          )}

          {/* CASE B: LOCKED PAID ITEM */}
          {item.is_paid && !isUnlocked && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Lock className="w-4 h-4 text-lime-400" />
                    <span>Locked Premium Prompt</span>
                  </div>
                  <span className="text-xs font-black text-lime-400">₹{item.price} Only</span>
                </div>

                {/* Blurred locked preview */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs font-mono text-zinc-500 select-none relative overflow-hidden filter blur-[2px]">
                  Masterpiece 8k cinematic studio portrait with exact lighting configuration, 85mm f/1.4 camera parameters, negative prompt, and photorealistic skin rendering...
                </div>

                {/* Features included */}
                <div className="space-y-1.5 text-xs text-zinc-300 pt-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                    <span>Complete verified Midjourney & Flux prompt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                    <span>Exact camera, lighting & aspect ratio settings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                    <span>Instant UPI unlock & lifetime access in My Unlocks</span>
                  </div>
                </div>
              </div>

              {/* Unlock Action Button */}
              <button
                onClick={() => {
                  onClose();
                  onUnlockClick(item);
                }}
                className="w-full py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-400/25 active:scale-95 transition-all"
              >
                <Unlock className="w-4 h-4 stroke-[2.5]" />
                <span>Unlock Now for ₹{item.price}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
