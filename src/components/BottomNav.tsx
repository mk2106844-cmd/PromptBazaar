import React from 'react';
import { Home, Camera, Film, Unlock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unlocksCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  unlocksCount,
}) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'home',
      label: t('tabHome'),
      icon: Home,
    },
    {
      id: 'photos',
      label: t('tabPhotoPrompts'),
      icon: Camera,
    },
    {
      id: 'videos',
      label: t('tabVideoAds'),
      icon: Film,
      badge: 'New',
    },
    {
      id: 'unlocks',
      label: t('tabMyUnlocks'),
      icon: Unlock,
      count: unlocksCount,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/90 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,8px))] shadow-2xl">
      <div className="max-w-md sm:max-w-xl mx-auto grid grid-cols-4 px-1.5 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-200 active:scale-90 min-h-[48px] select-none ${
                isActive
                  ? 'text-lime-400 font-black'
                  : 'text-zinc-500 hover:text-zinc-300 font-semibold'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? 'scale-110 text-lime-400 drop-shadow-[0_0_10px_rgba(163,230,53,0.6)]'
                      : 'text-zinc-500'
                  }`}
                />

                {item.count && item.count > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-lime-400 text-zinc-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                    {item.count}
                  </span>
                ) : null}

                {item.badge && !isActive && (
                  <span className="absolute -top-1.5 -right-3.5 bg-lime-400/20 text-lime-400 text-[8px] font-black px-1 rounded-full border border-lime-400/30">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] mt-1 tracking-tight truncate max-w-full block font-medium">
                {item.label}
              </span>

              {/* Active Tab Neon Pill Indicator */}
              {isActive && (
                <div className="w-5 h-0.5 bg-lime-400 rounded-full mt-0.5 shadow-[0_0_8px_#a3e635]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
