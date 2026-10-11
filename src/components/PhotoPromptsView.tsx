import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Tag, X, Crown, Camera, Flame, Share2, Film } from 'lucide-react';
import { PhotoItem } from '../types';
import { PhotoCard } from './PhotoCard';
import { APP_CONFIG } from '../config';
import { useLanguage } from '../context/LanguageContext';

interface PhotoPromptsViewProps {
  items: PhotoItem[];
  unlockedItemIds: Set<string>;
  unlockedSecrets: Record<string, string>;
  onUnlockClick: (item: PhotoItem) => void;
  onCopySuccess: (text: string) => void;
  onCardClick?: (item: PhotoItem) => void;
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
  onCardClick,
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
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (typeFilter === 'free' && item.is_paid) return false;
      if (typeFilter === 'paid' && !item.is_paid) return false;

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
    <div className="space-y-3 px-3 py-2 w-full max-w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search prompts (e.g. Wedding, Royal, Vintage)..."
          className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400/80 transition-colors font-medium"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs: All / Free / Paid */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center p-0.5 rounded-xl bg-zinc-900 border border-zinc-800 font-bold text-[11px]">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              typeFilter === 'all'
                ? 'bg-lime-400 text-zinc-950 font-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setTypeFilter('free')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              typeFilter === 'free'
                ? 'bg-lime-400 text-zinc-950 font-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Free ({items.filter((i) => !i.is_paid).length})
          </button>
          <button
            onClick={() => setTypeFilter('paid')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              typeFilter === 'paid'
                ? 'bg-lime-400 text-zinc-950 font-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Paid ({items.filter((i) => i.is_paid).length})
          </button>
        </div>

        <span className="text-[11px] text-zinc-400 font-bold">
          {filteredItems.length} prompts
        </span>
      </div>

      {/* Category Pills (horizontal scrollable with icons) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        {allCategories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all active:scale-95 shrink-0 text-xs ${
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

      {/* 2-Column Mobile Feed */}
      {filteredItems.length === 0 ? (
        <div className="py-14 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-6 space-y-2">
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
            className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold hover:bg-zinc-700 mt-2"
          >
            Filters Reset Karein
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {filteredItems.map((item) => (
            <PhotoCard
              key={item.id}
              item={item}
              isUnlocked={unlockedItemIds.has(item.id)}
              unlockedPromptText={unlockedSecrets[item.id]}
              onUnlockClick={onUnlockClick}
              onCopySuccess={onCopySuccess}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
