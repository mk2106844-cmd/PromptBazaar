import React from 'react';
import { Home, Image as ImageIcon, Video, Unlock, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

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
  const { isAdmin } = useAuth();

  const navItems = [
    {
      id: 'home',
      label: t('tabHome'),
      icon: Home,
    },
    {
      id: 'photos',
      label: t('tabPhotoPrompts'),
      icon: ImageIcon,
    },
    {
      id: 'videos',
      label: t('tabVideoAds'),
      icon: Video,
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/90 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] w-full max-w-full overflow-hidden shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-4 px-1 sm:px-2 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all active:scale-90 min-w-0 ${
                isActive
                  ? 'text-lime-400 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]' : 'text-zinc-400'
                  }`}
                />
                {item.count && item.count > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-lime-400 text-zinc-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {item.count}
                  </span>
                ) : null}
                {item.badge && (
                  <span className="absolute -top-1 -right-3.5 bg-zinc-800 text-lime-300 text-[8px] font-bold px-1 rounded border border-lime-400/30">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight truncate max-w-full block px-0.5">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-6 sm:w-8 h-0.5 bg-lime-400 rounded-full shadow-[0_0_6px_#a3e635]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
