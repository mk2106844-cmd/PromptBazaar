/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { APP_CONFIG } from './config';
import { PhotoItem, VideoItem, Order } from './types';
import { dataApi, isSupabaseConfigured } from './lib/supabase';

// Components
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HeroBanner } from './components/HeroBanner';
import { PhotoPromptsView } from './components/PhotoPromptsView';
import { PhotoCard } from './components/PhotoCard';
import { VideoAdsView } from './components/VideoAdsView';
import { MyUnlocksView } from './components/MyUnlocksView';
import { AdminPanel } from './components/AdminPanel';
import { UnlockModal } from './components/UnlockModal';
import { AuthModal } from './components/AuthModal';
import { SqlSetupModal } from './components/SqlSetupModal';
import { LegalModal, LegalTab } from './components/LegalModal';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';

import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Zap,
  Lock,
  Unlock,
  Video,
  Play,
  MousePointerClick,
  Smartphone,
  Crown,
  Camera,
  Flame,
  Share2,
  Film,
  Tag,
} from 'lucide-react';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'All':
      return <Sparkles className="w-3.5 h-3.5 text-lime-400" />;
    case 'Trending':
      return <Zap className="w-3.5 h-3.5 text-amber-400" />;
    case 'Wedding / Dulhan':
      return <Crown className="w-3.5 h-3.5 text-pink-400" />;
    case 'Cinematic Portrait':
      return <Camera className="w-3.5 h-3.5 text-cyan-400" />;
    case 'Instagram Reel Cover':
      return <Share2 className="w-3.5 h-3.5 text-rose-400" />;
    case 'Festival & Puja':
      return <Flame className="w-3.5 h-3.5 text-orange-400" />;
    case 'Cyberpunk & 3D':
      return <Film className="w-3.5 h-3.5 text-purple-400" />;
    default:
      return <Tag className="w-3.5 h-3.5 text-lime-400" />;
  }
};

function MainContent() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();

  // Navigation State: 'home' | 'photos' | 'videos' | 'unlocks' | 'admin'
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState('');

  // Photo Data States
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [unlockedPhotoItemIds, setUnlockedPhotoItemIds] = useState<Set<string>>(new Set());
  const [unlockedPhotoSecrets, setUnlockedPhotoSecrets] = useState<Record<string, string>>({});

  // Video Data States (Phase 2)
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [unlockedVideoItemIds, setUnlockedVideoItemIds] = useState<Set<string>>(new Set());
  const [unlockedVideoSecrets, setUnlockedVideoSecrets] = useState<Record<string, string>>({});

  // User Orders
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Modals
  const [activeUnlockItem, setActiveUnlockItem] = useState<PhotoItem | VideoItem | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Home Infinite Scroll States
  const [homePhotoItems, setHomePhotoItems] = useState<PhotoItem[]>([]);
  const [homePage, setHomePage] = useState(0);
  const [homeHasMore, setHomeHasMore] = useState(true);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeLoadingMore, setHomeLoadingMore] = useState(false);
  const [homeCategory, setHomeCategory] = useState<string>('All');
  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  // Load / Refresh Home Photos (Page 0, 12 items)
  const loadHomePhotos = useCallback(async (cat: string = 'All') => {
    setHomeLoading(true);
    setHomePage(0);
    try {
      const res = await dataApi.getPhotoItemsPaginated({ page: 0, pageSize: 12, category: cat });
      setHomePhotoItems(res.items);
      setHomeHasMore(res.hasMore);
    } catch (err) {
      console.error('Error fetching home photos:', err);
    } finally {
      setHomeLoading(false);
    }
  }, []);

  // Infinite Scroll: Load Next Page (12 items)
  const loadMoreHomePhotos = useCallback(async () => {
    if (homeLoading || homeLoadingMore || !homeHasMore) return;
    setHomeLoadingMore(true);
    const nextPage = homePage + 1;
    try {
      const res = await dataApi.getPhotoItemsPaginated({
        page: nextPage,
        pageSize: 12,
        category: homeCategory,
      });
      if (res.items.length > 0) {
        setHomePhotoItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const fresh = res.items.filter((i) => !existingIds.has(i.id));
          return [...prev, ...fresh];
        });
        setHomePage(nextPage);
        setHomeHasMore(res.hasMore);
      } else {
        setHomeHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more home photos:', err);
    } finally {
      setHomeLoadingMore(false);
    }
  }, [homeLoading, homeLoadingMore, homeHasMore, homePage, homeCategory]);

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    if (!observerTargetRef.current || !homeHasMore || homeLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreHomePhotos();
        }
      },
      { threshold: 0.1, rootMargin: '250px' }
    );

    observer.observe(observerTargetRef.current);
    return () => observer.disconnect();
  }, [loadMoreHomePhotos, homeHasMore, homeLoading]);

  // Handle Category Filter Change on Home Page
  const handleHomeCategoryChange = (cat: string) => {
    setHomeCategory(cat);
    loadHomePhotos(cat);
  };

  // Fetch Public Photo Items (Updates full list for tabs AND Home infinite scroll list)
  const loadPhotos = async () => {
    setLoadingPhotos(true);
    try {
      const [items] = await Promise.all([
        dataApi.getPhotoItems(),
        loadHomePhotos(homeCategory),
      ]);
      setPhotoItems(items);
    } catch (err) {
      console.error('Error fetching photos:', err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  // Fetch Public Video Items (Phase 2)
  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      const items = await dataApi.getVideoItems();
      setVideoItems(items);
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  // Fetch User's Orders & Unlocked Secrets (Photos & Videos)
  const loadUserUnlocks = async () => {
    try {
      const orders = await dataApi.getUserOrders(user?.id, user?.email);
      setUserOrders(orders);

      const approvedPhotoIds = new Set<string>();
      const photoSecretsMap: Record<string, string> = {};

      const approvedVideoIds = new Set<string>();
      const videoSecretsMap: Record<string, string> = {};

      for (const order of orders) {
        if (order.status === 'approved') {
          if (order.item_type === 'video') {
            approvedVideoIds.add(order.item_id);
            const secret = await dataApi.getVideoSecret(order.item_id, user?.email, isAdmin);
            if (secret) {
              videoSecretsMap[order.item_id] = secret;
            }
          } else {
            approvedPhotoIds.add(order.item_id);
            const secret = await dataApi.getSecretPrompt(order.item_id, user?.email, isAdmin);
            if (secret) {
              photoSecretsMap[order.item_id] = secret;
            }
          }
        }
      }

      setUnlockedPhotoItemIds(approvedPhotoIds);
      setUnlockedPhotoSecrets(photoSecretsMap);

      setUnlockedVideoItemIds(approvedVideoIds);
      setUnlockedVideoSecrets(videoSecretsMap);
    } catch (err) {
      console.error('Error loading unlocks:', err);
    }
  };

  useEffect(() => {
    loadPhotos();
    loadVideos();
  }, []);

  useEffect(() => {
    loadUserUnlocks();
  }, [user, isAdmin]);

  // Order created callback
  const handleOrderCreated = (order: Order) => {
    setUserOrders((prev) => [order, ...prev]);
    showToast('Payment Proof Submitted! Verification in 10-15m.');
    loadUserUnlocks();
  };

  const handleUnlockPhotoClick = (item: PhotoItem) => {
    setActiveUnlockItem(item);
  };

  const handleUnlockVideoClick = (item: VideoItem) => {
    setActiveUnlockItem(item);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Toast Feedback */}
      <Toast message={toastMessage} />

      {/* Sticky Top Bar */}
      <Header
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Hero Banner with two big buttons */}
            <HeroBanner
              onSelectPhotos={() => setActiveTab('photos')}
              onSelectVideos={() => setActiveTab('videos')}
            />

            {/* Privacy Caution Banner */}
            <div className="max-w-4xl mx-auto px-4">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800/90 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{t('disclaimerBanner')}</span>
                </div>
                <button
                  onClick={() => setLegalModalTab('disclaimer')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 underline shrink-0 whitespace-nowrap"
                >
                  Details
                </button>
              </div>
            </div>

            {/* 3-Step "How It Works" Strip with Icons */}
            <div className="max-w-4xl mx-auto px-4">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3.5 sm:p-4">
                <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-zinc-300">
                  <Zap className="w-3.5 h-3.5 text-lime-400" />
                  <span>How PromptBazaar Works in 3 Simple Steps</span>
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
                        Photo editing ya Video Ad prompt select karein
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
                        GPay / PhonePe scan karein & screenshot dalein
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
                        Instant prompt copy & Midjourney me run karein
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Category Chip Row Above Home Grid */}
            <div className="sticky top-[52px] sm:top-14 z-30 bg-zinc-950/95 backdrop-blur-md py-2.5 px-4 border-y border-zinc-800/80 -mx-4 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-lg">
              {APP_CONFIG.photoCategories.map((category) => {
                const isSelected = homeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => handleHomeCategoryChange(category)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all active:scale-95 shrink-0 text-xs font-semibold ${
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

            {/* All Photo Editing Prompts (Full Grid with Infinite Scroll) */}
            <div className="max-w-4xl mx-auto px-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-lime-400" />
                    <span>All Photo Editing Prompts</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Latest viral prompts • Newest & featured first
                  </p>
                </div>
                {homePhotoItems.length > 0 && (
                  <span className="text-[11px] font-bold text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full border border-lime-400/20">
                    {homePhotoItems.length} loaded
                  </span>
                )}
              </div>

              {/* Grid of ALL published photo items */}
              {homeLoading && homePhotoItems.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                  <span>Prompts load ho rahe hain...</span>
                </div>
              ) : homePhotoItems.length === 0 ? (
                <div className="py-16 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800/60 p-6 space-y-2">
                  <p className="text-sm font-bold text-zinc-300">Is category me koi prompt nahi mila</p>
                  <p className="text-xs text-zinc-500">Doosri category select karke dekhein ya filter clear karein.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {homePhotoItems.map((item) => (
                    <PhotoCard
                      key={item.id}
                      item={item}
                      isUnlocked={unlockedPhotoItemIds.has(item.id)}
                      unlockedPromptText={unlockedPhotoSecrets[item.id]}
                      onUnlockClick={handleUnlockPhotoClick}
                      onCopySuccess={() => showToast(t('promptCopied'))}
                    />
                  ))}
                </div>
              )}

              {/* Infinite Scroll Trigger & Bottom Loading / Completion Indicators */}
              <div ref={observerTargetRef} className="py-2">
                {homeLoadingMore && (
                  <div className="py-4 flex items-center justify-center gap-2 text-zinc-400 text-xs">
                    <div className="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                    <span>Aur prompts load ho rahe hain...</span>
                  </div>
                )}
                {!homeHasMore && homePhotoItems.length > 0 && (
                  <div className="py-6 text-center text-zinc-500 text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                    <span>Bas itna hi! Sabhi photo prompts load ho chuke hain.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Video Ads Highlight Showcase Card */}
            <div className="max-w-4xl mx-auto px-4 pt-4">
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                  {/* Video Preview Card with Play Overlay */}
                  <div
                    onClick={() => setActiveTab('videos')}
                    className="relative w-full md:w-64 aspect-[16/10] md:aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-700/80 shadow-lg group cursor-pointer shrink-0"
                  >
                    <img
                      src={
                        videoItems[0]?.thumbnail_url ||
                        'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={videoItems[0]?.title || 'Featured Video Ad'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                    {/* Glowing Play Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-lime-400 text-zinc-950 flex items-center justify-center shadow-lg shadow-lime-400/40 group-hover:scale-110 active:scale-95 transition-all">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    </div>

                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md text-[10px] font-bold text-lime-400 border border-lime-400/30">
                        HD Preview
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white truncate max-w-[150px]">
                        {videoItems[0]?.title || 'Festival Sale 9:16 Video Ad'}
                      </span>
                      <span className="font-mono text-zinc-300 text-[10px] bg-zinc-950/80 px-1.5 py-0.5 rounded">
                        0:30
                      </span>
                    </div>
                  </div>

                  {/* Video Ads Details & CTA */}
                  <div className="flex-1 text-left w-full">
                    <span className="text-[10px] font-black uppercase tracking-wider text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full border border-lime-400/20 inline-block">
                      Live Video Ads Bazaar
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-white mt-1.5 leading-snug">
                      High-Converting Video Ads for Shops, DJ Events, Clinics & Festivals
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      AI video prompts for Runway & Kling or ready-to-use 9:16 vertical reels. Instant UPI unlock or custom WhatsApp order.
                    </p>
                    <div className="mt-3.5 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setActiveTab('videos')}
                        className="px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black text-xs shadow-md shadow-lime-400/20 transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch Video Ads ({videoItems.length})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PHOTO PROMPTS */}
        {activeTab === 'photos' && (
          <PhotoPromptsView
            items={photoItems}
            unlockedItemIds={unlockedPhotoItemIds}
            unlockedSecrets={unlockedPhotoSecrets}
            onUnlockClick={handleUnlockPhotoClick}
            onCopySuccess={() => showToast(t('promptCopied'))}
            initialSearchQuery={searchQuery}
          />
        )}

        {/* TAB 3: VIDEO ADS (PHASE 2 - FULL IMPLEMENTATION) */}
        {activeTab === 'videos' && (
          <VideoAdsView
            items={videoItems}
            unlockedItemIds={unlockedVideoItemIds}
            unlockedSecrets={unlockedVideoSecrets}
            onUnlockClick={handleUnlockVideoClick}
            onCopySuccess={() => showToast(t('promptCopied'))}
            initialSearchQuery={searchQuery}
          />
        )}

        {/* TAB 4: MY UNLOCKS */}
        {activeTab === 'unlocks' && (
          <MyUnlocksView
            onBrowsePhotos={() => setActiveTab('photos')}
            onBrowseVideos={() => setActiveTab('videos')}
            onCopySuccess={() => showToast(t('promptCopied'))}
            photoItems={photoItems}
            videoItems={videoItems}
          />
        )}

        {/* TAB 5: ADMIN PANEL */}
        {activeTab === 'admin' && (
          <AdminPanel
            onPhotosUpdated={loadPhotos}
            onVideosUpdated={loadVideos}
            onOpenSqlModal={() => setIsSqlModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onOpenLegal={(tab) => setLegalModalTab(tab)} />

      {/* Sticky Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unlocksCount={userOrders.length}
      />

      {/* Modals */}
      {activeUnlockItem && (
        <UnlockModal
          item={activeUnlockItem}
          onClose={() => setActiveUnlockItem(null)}
          onOrderCreated={handleOrderCreated}
          onOpenMyUnlocks={() => setActiveTab('unlocks')}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <SqlSetupModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      <LegalModal
        isOpen={Boolean(legalModalTab)}
        onClose={() => setLegalModalTab(null)}
        initialTab={legalModalTab || 'terms'}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
