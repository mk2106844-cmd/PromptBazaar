import React, { useState, useMemo } from 'react';
import { Search, Filter, Sparkles, Tag, X, Check, Crown, Camera, Flame, Share2, Film, Zap, MousePointerClick, Smartphone, Unlock } from 'lucide-react';
import { PhotoItem } from '../types';
import { PhotoCard } from './PhotoCard';
import { APP_CONFIG, PhotoCategory } from '../config';
import { useLanguage } from '../context/LanguageContext';

interface PhotoPromptsViewProps {
  items: PhotoItem[];
  unlockedItemIds: Set<string>;
  unlockedSecrets: Record<string, string>;
  onUnlockClick: (item: PhotoItem) => void;
  onCopySuccess: (text: string) => void;
  initialSearchQuery?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'All':
      return <Sparkles className="w-3.5 h-3.5 text-lime-400" />;
    case 'Wedding & Royal':
      return <Crown className="w-3.5 h-3.5 text-amber-400" />;
    case 'Portraits & Fashion':
      return <Camera className="w-3.5 h-3.5 text-cyan-400" />;
    case 'Festivals & Culture':
      return <Flame className="w-3.5 h-3.5 text-orange-400" />;
    case 'Social Media & DP':
      return <Share2 className="w-3.5 h-3.5 text-pink-400" />;
    case 'Cinematic & 3D':
      return <Film className="w-3.5 h-3.5 text-purple-400" />;
    default:
      return <Tag className="w-3.5 h-3.5 text-lime-400" />;
  }
};

export const PhotoPromptsView: React.FC<PhotoPromptsViewProps> = ({
  items,
  unlockedItemIds,
  unlockedSecrets,
  onUnlockClick,
  onCopySuccess,
  initialSearchQuery = '',
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const allCategories = useMemo(() => {
    const list: string[] = ['All'];
    APP_CONFIG.photoCategories.forEach((cat) => {
      if (cat !== 'All' && !list.includes(cat)) list.push(cat);
    });
    items.forEach((item) => {
      if (item.category && !list.includes(item.category)) {
        list.push(item.category);
      }
    });
    return list;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Type filter (Free vs Paid)
      if (typeFilter === 'free' && item.is_paid) return false;
      if (typeFilter === 'paid' && !item.is_paid) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesPrompt = item.free_prompt_text?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesDesc && !matchesPrompt) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, typeFilter, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Page Title & Subtitle */}
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-lime-400/20 text-lime-400">
            <Sparkles className="w-5 h-5" />
          </span>
          <h2 className="text-2xl font-black text-white">
            AI Photo Editing Prompts
          </h2>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Midjourney, Flux aur Bing ke tested photorealistic prompts. Instant copy ya ₹19-₹49 me unlock karein.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400/70 transition-colors shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Free / Paid Filter Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-bold">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'all'
                ? 'bg-lime-400 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t('filterAll')} ({items.length})
          </button>
          <button
            onClick={() => setTypeFilter('free')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'free'
                ? 'bg-emerald-500 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t('filterFree')} ({items.filter((i) => !i.is_paid).length})
          </button>
          <button
            onClick={() => setTypeFilter('paid')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'paid'
                ? 'bg-lime-400 text-zinc-950 shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t('filterPaid')} ({items.filter((i) => i.is_paid).length})
          </button>
        </div>

        <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">
          Showing {filteredItems.length} prompts
        </span>
      </div>

      {/* Category Pills (horizontal scrollable with icons) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar text-xs font-semibold">
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                isSelected
                  ? 'bg-zinc-800 text-lime-400 border border-lime-400/50 shadow-sm font-bold'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              {getCategoryIcon(category)}
              <span>{category}</span>
            </button>
          );
        })}
      </div>

      {/* 3-Step "How It Works" Strip with Icons */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4">
        <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-zinc-300">
          <Zap className="w-3.5 h-3.5 text-lime-400" />
          <span>How It Works in 3 Simple Steps</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60">
            <div className="w-7 h-7 rounded-lg bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center shrink-0 font-black text-xs">
              1
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-white flex items-center gap-1">
                <MousePointerClick className="w-3 h-3 text-lime-400" />
                Pick Prompt
              </span>
              <span className="text-[11px] text-zinc-400 leading-tight block">
                Free copy ya ₹19-₹49 me unlock karein
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60">
            <div className="w-7 h-7 rounded-lg bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center shrink-0 font-black text-xs">
              2
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-white flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-lime-400" />
                Pay by UPI
              </span>
              <span className="text-[11px] text-zinc-400 leading-tight block">
                GPay/PhonePe scan & instant screenshot
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60">
            <div className="w-7 h-7 rounded-lg bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center shrink-0 font-black text-xs">
              3
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-white flex items-center gap-1">
                <Unlock className="w-3 h-3 text-lime-400" />
                Get Prompt
              </span>
              <span className="text-[11px] text-zinc-400 leading-tight block">
                Instant full prompt copy & Midjourney run
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid (Photo on top, prompt below) */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800/60 p-6 space-y-3">
          <p className="text-sm font-bold text-zinc-300">
            Koi prompt match nahi hua
          </p>
          <p className="text-xs text-zinc-500">
            Search query badal kar dekhein ya filter clear karein.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setTypeFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold hover:bg-zinc-700"
          >
            Filters Reset Karein
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <PhotoCard
              key={item.id}
              item={item}
              isUnlocked={unlockedItemIds.has(item.id)}
              unlockedPromptText={unlockedSecrets[item.id]}
              onUnlockClick={onUnlockClick}
              onCopySuccess={onCopySuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
};
