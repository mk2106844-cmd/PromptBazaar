/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { PromptDetailModal } from './components/PromptDetailModal';
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
  const [selectedPromptForDetail, setSelectedPromptForDetail] = useState<PhotoItem | null>(null);
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

  // Compute all available photo categories (config categories + categories from database items)
  const homeCategories = useMemo(() => {
    const list: string[] = ['All'];
    APP_CONFIG.photoCategories.forEach((cat) => {
      if (cat !== 'All' && !list.includes(cat)) list.push(cat);
    });
    photoItems.forEach((item) => {
      if (item.category && !list.includes(item.category)) {
        list.push(item.category);
      }
    });
    return list;
  }, [photoItems]);

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans max-w-md sm:max-w-xl mx-auto w-full shadow-2xl relative overflow-x-hidden border-x border-zinc-900/60">
      {/* Toast Feedback */}
      <Toast message={toastMessage} />

      {/* Compact Android App Header */}
      <Header
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Body (pb-24 guarantees bottom nav never occludes content) */}
      <main className="flex-1 pb-24">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-3">
            {/* Sticky Category Chip Row Above Home Grid */}
            <div className="sticky top-[53px] z-30 bg-zinc-950/95 backdrop-blur-md py-2 px-3 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-sm">
              {homeCategories.map((category) => {
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

            {/* Compact Mobile App Promo Highlight */}
            <div className="px-3 pt-1">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 shadow-md">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-lime-400 bg-lime-400/10 px-1.5 py-0.2 rounded border border-lime-400/20">
                      Bazaar
                    </span>
                    <span className="text-xs font-extrabold text-white truncate">
                      Viral AI Prompts & Ads
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                    Tap any card to view prompt & copy instantly
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('videos')}
                  className="px-2.5 py-1.5 rounded-xl bg-lime-400 text-zinc-950 text-[10px] font-black flex items-center gap-1 shadow-sm shrink-0 active:scale-95"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Videos ({videoItems.length})</span>
                </button>
              </div>
            </div>

            {/* All Photo Editing Prompts (2-Column Mobile Feed) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-3">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                  <span>Trending Prompts</span>
                </h3>
                {homePhotoItems.length > 0 && (
                  <span className="text-[10px] font-bold text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded-full border border-lime-400/20">
                    {homePhotoItems.length} prompts
                  </span>
                )}
              </div>

              {/* Grid of ALL published photo items in 2 columns */}
              {homeLoading && homePhotoItems.length === 0 ? (
                <div className="py-14 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-2.5">
                  <div className="w-5 h-5 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                  <span>Prompts load ho rahe hain...</span>
                </div>
              ) : homePhotoItems.length === 0 ? (
                <div className="py-14 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-6 mx-3 space-y-2">
                  <p className="text-sm font-bold text-zinc-300">Is category me koi prompt nahi mila</p>
                  <p className="text-xs text-zinc-500">Doosri category select karein ya filter clear karein.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 px-3">
                  {homePhotoItems.map((item) => (
                    <PhotoCard
                      key={item.id}
                      item={item}
                      isUnlocked={unlockedPhotoItemIds.has(item.id)}
                      unlockedPromptText={unlockedPhotoSecrets[item.id]}
                      onUnlockClick={handleUnlockPhotoClick}
                      onCopySuccess={() => showToast(t('promptCopied'))}
                      onCardClick={(clicked) => setSelectedPromptForDetail(clicked)}
                    />
                  ))}
                </div>
              )}

              {/* Infinite Scroll Trigger & Bottom Loading / Completion Indicators */}
              <div ref={observerTargetRef} className="py-2">
                {homeLoadingMore && (
                  <div className="py-3 flex items-center justify-center gap-2 text-zinc-400 text-xs">
                    <div className="w-3.5 h-3.5 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px]">Aur prompts load ho rahe hain...</span>
                  </div>
                )}
                {!homeHasMore && homePhotoItems.length > 0 && (
                  <div className="py-4 text-center text-zinc-500 text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-lime-400" />
                    <span className="text-[11px]">Bas itna hi! Sabhi photo prompts load ho chuke hain.</span>
                  </div>
                )}
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
            onCardClick={(clicked) => setSelectedPromptForDetail(clicked)}
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
      {selectedPromptForDetail && (
        <PromptDetailModal
          item={selectedPromptForDetail}
          isOpen={Boolean(selectedPromptForDetail)}
          onClose={() => setSelectedPromptForDetail(null)}
          isUnlocked={unlockedPhotoItemIds.has(selectedPromptForDetail.id)}
          unlockedPromptText={unlockedPhotoSecrets[selectedPromptForDetail.id]}
          onUnlockClick={handleUnlockPhotoClick}
          onCopySuccess={() => showToast(t('promptCopied'))}
        />
      )}

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
