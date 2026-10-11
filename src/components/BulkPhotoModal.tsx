import React, { useState } from 'react';
import { X, Upload, Sparkles, Check, AlertCircle, Trash2, ArrowRight, Layers, Tag } from 'lucide-react';
import { PhotoCategory, APP_CONFIG } from '../config';
import { compressImageTo500KB } from '../lib/compression';
import { dataApi } from '../lib/supabase';
import { PhotoItem } from '../types';

interface BulkPhotoItemDraft {
  id: string;
  file: File;
  previewUrl: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  title: string;
  category: string;
  prompt: string;
  isPaid: boolean;
  price: number;
}

interface BulkPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCategories: string[];
  onNewCategoryCreated: (cat: string) => void;
}

export const BulkPhotoModal: React.FC<BulkPhotoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingCategories,
  onNewCategoryCreated,
}) => {
  const [drafts, setDrafts] = useState<BulkPhotoItemDraft[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number; percent: number } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Global settings helper
  const [globalCategory, setGlobalCategory] = useState<string>('Wedding / Dulhan');
  const [globalIsPaid, setGlobalIsPaid] = useState<boolean>(true);
  const [globalPrice, setGlobalPrice] = useState<number>(29);

  if (!isOpen) return null;

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 20) {
      setFeedback({
        type: 'error',
        message: '⚠️ Ek baar me maximum 20 images upload kar sakte hain. Pehle 20 images select ki gayi hain.',
      });
    }

    const selectedFiles = Array.from(files).slice(0, 20);
    setIsCompressing(true);
    setFeedback(null);

    const newDrafts: BulkPhotoItemDraft[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setCompressProgress(`Compressing image ${i + 1} of ${selectedFiles.length}... (< 500 KB)`);

      try {
        const compressed = await compressImageTo500KB(file);
        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        newDrafts.push({
          id: `draft-${Date.now()}-${i}`,
          file: compressed.file,
          previewUrl: compressed.dataUrl,
          originalSizeKB: Math.round(compressed.originalSizeBytes / 1024),
          compressedSizeKB: Math.round(compressed.compressedSizeBytes / 1024),
          title: cleanTitle,
          category: globalCategory,
          prompt: '',
          isPaid: globalIsPaid,
          price: globalPrice,
        });
      } catch (err: any) {
        console.error('Compression error:', err);
      }
    }

    setDrafts(newDrafts);
    setIsCompressing(false);
    setCompressProgress('');
  };

  const handleApplyToAll = () => {
    setDrafts((prev) =>
      prev.map((d) => ({
        ...d,
        category: globalCategory,
        isPaid: globalIsPaid,
        price: globalPrice,
      }))
    );
    setFeedback({
      type: 'success',
      message: 'Settings sabhi images par apply kar di gayi hain! ✅',
    });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleRemoveDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateDraft = (id: string, updates: Partial<BulkPhotoItemDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const handleSaveAll = async () => {
    if (drafts.length === 0) return;

    // Validate that each draft has a prompt and title
    const invalidDraft = drafts.find((d) => !d.title.trim() || !d.prompt.trim());
    if (invalidDraft) {
      setFeedback({
        type: 'error',
        message: 'Kripya sabhi photos ke liye Title aur Prompt bharein.',
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    setSaveProgress({ current: 0, total: drafts.length, percent: 0 });

    try {
      for (let i = 0; i < drafts.length; i++) {
        const item = drafts[i];
        setSaveProgress({
          current: i + 1,
          total: drafts.length,
          percent: Math.round(((i + 1) / drafts.length) * 100),
        });

        // 1. Upload media
        const uploadedUrl = await dataApi.uploadMediaFile(item.file);

        // 2. Save item + secret
        await dataApi.savePhotoItem(
          {
            title: item.title,
            category: item.category,
            is_paid: item.isPaid,
            price: item.isPaid ? item.price : 0,
            image_url: uploadedUrl,
            is_published: true,
          },
          item.prompt
        );
      }

      setFeedback({
        type: 'success',
        message: `Sabhi ${drafts.length} photo prompts safaltapoorvak upload aur publish ho gaye! 🎉`,
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Error saving bulk items: ' + (err.message || 'Server error'),
      });
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 my-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-lime-400/20 text-lime-400 border border-lime-400/30">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-white">
                Bulk Add Photos (Up to 20 Images)
              </h2>
              <p className="text-xs text-zinc-400">
                Browser auto-compresses each image to &lt; 500 KB before saving.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          {drafts.length === 0 ? (
            /* Upload Initial Picker */
            <div className="py-12 border-2 border-dashed border-zinc-700 hover:border-lime-400/60 rounded-3xl p-8 text-center bg-zinc-950/60 transition-colors">
              <Upload className="w-12 h-12 text-lime-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">
                Ek Sath 20 Photos Select Karein
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mb-5">
                Sabhi photos browser mein automatically 500 KB se kam size par compress ho jayengi.
              </p>

              <label className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-xs cursor-pointer shadow-lg shadow-lime-400/20 active:scale-95 transition-all">
                <Upload className="w-4 h-4" />
                <span>Select Multiple Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFilesSelect}
                  className="hidden"
                />
              </label>

              {isCompressing && (
                <div className="mt-4 p-3 bg-zinc-900 rounded-xl text-xs text-lime-400 font-mono animate-pulse">
                  {compressProgress}
                </div>
              )}
            </div>
          ) : (
            /* Selected Items Mini-Forms */
            <div className="space-y-4">
              {/* Quick Batch Settings Toolbar */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-bold text-zinc-300">Set for All:</span>

                  <select
                    value={globalCategory}
                    onChange={(e) => setGlobalCategory(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white font-medium focus:outline-none"
                  >
                    {existingCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalIsPaid}
                      onChange={(e) => setGlobalIsPaid(e.target.checked)}
                      className="w-4 h-4 accent-lime-400 rounded"
                    />
                    <span className="text-zinc-300 font-medium">Paid</span>
                  </label>

                  {globalIsPaid && (
                    <div className="flex items-center gap-1">
                      <span className="text-lime-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={globalPrice}
                        onChange={(e) => setGlobalPrice(Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-white font-bold"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleApplyToAll}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-lime-400 font-bold transition-colors"
                  >
                    Apply to All
                  </button>
                </div>

                <div className="text-xs text-zinc-400 font-semibold">
                  {drafts.length} Photos Selected
                </div>
              </div>

              {/* Mini-Forms List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {drafts.map((draft, idx) => (
                  <div
                    key={draft.id}
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 space-y-3 relative group hover:border-zinc-700 transition-colors"
                  >
                    {/* Top Row: Thumbnail & Title & Delete */}
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-800 shrink-0 bg-black">
                        <img
                          src={draft.previewUrl}
                          alt={draft.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center font-mono text-lime-400 truncate">
                          {draft.compressedSizeKB} KB
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold text-zinc-500">
                            #{idx + 1}
                          </span>
                          <button
                            onClick={() => handleRemoveDraft(draft.id)}
                            className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                            title="Remove this photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={draft.title}
                          onChange={(e) => handleUpdateDraft(draft.id, { title: e.target.value })}
                          placeholder="Title..."
                          className="w-full px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white font-bold focus:outline-none focus:border-lime-400"
                        />
                      </div>
                    </div>

                    {/* Settings Row: Category & Free/Paid */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <select
                        value={draft.category}
                        onChange={(e) => handleUpdateDraft(draft.id, { category: e.target.value })}
                        className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] focus:outline-none"
                      >
                        {existingCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={draft.isPaid}
                            onChange={(e) => handleUpdateDraft(draft.id, { isPaid: e.target.checked })}
                            className="w-3.5 h-3.5 accent-lime-400 rounded"
                          />
                          <span className={draft.isPaid ? 'text-lime-400 font-bold' : 'text-zinc-400'}>
                            {draft.isPaid ? 'Paid' : 'Free'}
                          </span>
                        </label>

                        {draft.isPaid && (
                          <div className="flex items-center gap-0.5">
                            <span className="text-lime-400 font-bold text-[11px]">₹</span>
                            <input
                              type="number"
                              value={draft.price}
                              onChange={(e) => handleUpdateDraft(draft.id, { price: Number(e.target.value) })}
                              className="w-14 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-white text-xs font-bold"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prompt Textarea */}
                    <div>
                      <textarea
                        rows={2}
                        value={draft.prompt}
                        onChange={(e) => handleUpdateDraft(draft.id, { prompt: e.target.value })}
                        placeholder="Write full AI prompt (Midjourney / Flux / Bing)..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-lime-400 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar (if saving) */}
        {isSaving && saveProgress && (
          <div className="py-2 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-lime-400">
              <span>Saving Item {saveProgress.current} of {saveProgress.total}...</span>
              <span>{saveProgress.percent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-lime-400 transition-all duration-300"
                style={{ width: `${saveProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => setDrafts([])}
            disabled={isSaving || drafts.length === 0}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold disabled:opacity-30"
          >
            Clear All
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
            >
              Cancel
            </button>

            {drafts.length > 0 && (
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-xs shadow-lg shadow-lime-400/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Uploading All...' : `Save All ${drafts.length} Prompts`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
