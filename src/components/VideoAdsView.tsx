import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Tag, X, MessageCircle, Video, Film, Play, ExternalLink } from 'lucide-react';
import { VideoItem } from '../types';
import { VideoCard } from './VideoCard';
import { APP_CONFIG, VideoCategory } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { useAppSettings } from '../lib/settings';

interface VideoAdsViewProps {
  items: VideoItem[];
  unlockedItemIds: Set<string>;
  unlockedSecrets: Record<string, string>;
  onUnlockClick: (item: VideoItem) => void;
  onCopySuccess: (text: string) => void;
  initialSearchQuery?: string;
}

export const VideoAdsView: React.FC<VideoAdsViewProps> = ({
  items,
  unlockedItemIds,
  unlockedSecrets,
  onUnlockClick,
  onCopySuccess,
  initialSearchQuery = '',
}) => {
  const { t } = useLanguage();
  const settings = useAppSettings();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'prompt' | 'ready_video'>('all');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);

  const currentWhatsapp = settings.whatsappNumber || APP_CONFIG.whatsapp.number;
  const whatsappUrl = `https://wa.me/${currentWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    APP_CONFIG.whatsapp.customAdMessage
  )}`;

  const videoCategories = [
    'All',
    ...APP_CONFIG.videoCategories,
  ];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Free vs Paid filter
      if (typeFilter === 'free' && item.is_paid) return false;
      if (typeFilter === 'paid' && !item.is_paid) return false;

      // Item type filter (prompt vs ready_video)
      if (itemTypeFilter !== 'all' && item.item_type !== itemTypeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesContent = item.free_content?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesDesc && !matchesContent) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, typeFilter, itemTypeFilter, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-lime-400/20 text-lime-400">
              <Video className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-black text-white">
              {t('videoAdsTitle')}
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg">
            {t('videoAdsSub')}
          </p>
        </div>

        {/* Custom Ad Banwao Button (WhatsApp) */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all shrink-0 w-full sm:w-auto"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>{t('customAdBtn')}</span>
        </a>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Video Ads search karein (Shop, DJ, Clinic, CSC, Festival...)"
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

      {/* Primary Filter Tabs: Free/Paid & Prompts/Ready Video */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Free / Paid Filter */}
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

        {/* Prompt vs Ready Video Filter */}
        <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-bold">
          <button
            onClick={() => setItemTypeFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg transition-all ${
              itemTypeFilter === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setItemTypeFilter('prompt')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              itemTypeFilter === 'prompt'
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>AI Prompts</span>
          </button>
          <button
            onClick={() => setItemTypeFilter('ready_video')}
            className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              itemTypeFilter === 'ready_video'
                ? 'bg-purple-500/30 text-purple-300 border border-purple-400/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Film className="w-3 h-3 text-purple-400" />
            <span>Ready Reels</span>
          </button>
        </div>
      </div>

      {/* Category Pills (horizontal scrollable) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs font-semibold">
        {videoCategories.map((category) => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all active:scale-95 ${
                isSelected
                  ? 'bg-zinc-800 text-lime-400 border border-lime-400/50 shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Items Grid (Thumbnail on top, details below) */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800/60 p-6 space-y-3">
          <p className="text-sm font-bold text-zinc-300">
            Koi video ad match nahi hua
          </p>
          <p className="text-xs text-zinc-500">
            Search query badal kar dekhein ya filters reset karein.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setTypeFilter('all');
              setItemTypeFilter('all');
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
            <VideoCard
              key={item.id}
              item={item}
              isUnlocked={unlockedItemIds.has(item.id)}
              unlockedSecretContent={unlockedSecrets[item.id]}
              onUnlockClick={onUnlockClick}
              onCopySuccess={onCopySuccess}
              onPlayPreview={(v) => setPlayingVideo(v)}
            />
          ))}
        </div>
      )}

      {/* VIDEO PREVIEW MODAL */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-2xl">
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center shadow hover:bg-zinc-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white mb-2 truncate">
              {playingVideo.title} ({playingVideo.duration})
            </h3>

            {playingVideo.video_url ? (
              <video
                src={playingVideo.video_url}
                controls
                autoPlay
                className="w-full rounded-2xl max-h-[70vh] bg-black object-contain"
              />
            ) : (
              <div className="aspect-[16/9] bg-zinc-950 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Video className="w-10 h-10 text-lime-400" />
                <p className="text-xs text-zinc-300 font-bold">
                  Preview video sample ready for this item.
                </p>
                <p className="text-[11px] text-zinc-500">
                  Full HD prompt / reel file unlock karne ke baad instantly download ho jayega.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
