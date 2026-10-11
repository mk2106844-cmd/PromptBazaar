import React from 'react';
import { Sparkles, Shield, User, Globe, Search, Database, Download } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { useLanguage, Language } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenSqlModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenSqlModal,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
}) => {
  const { language, setLanguage } = useLanguage();
  const { user, isAdmin } = useAuth();
  const { isInstallable, promptInstall } = usePWAInstall();

  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-2.5 sm:px-4 py-2 sm:py-3 w-full max-w-full">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
        {/* Logo */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-1.5 sm:gap-2 group text-left transition-transform active:scale-95 shrink min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-lime-400/20 font-black shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-zinc-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-base sm:text-xl font-extrabold tracking-tight text-white group-hover:text-lime-400 transition-colors truncate">
                {APP_CONFIG.name}
              </span>
              <span className="text-[9px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.2 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/30 shrink-0">
                PRO
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-zinc-400 hidden md:block font-medium truncate">
              Indian Creator Bazaar
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Supabase status / SQL helper button */}
          <button
            onClick={onOpenSqlModal}
            title={isSupabaseConfigured ? 'Supabase Connected' : 'Supabase SQL & Setup Guide'}
            className={`hidden md:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
              isSupabaseConfigured
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/50'
                : 'bg-zinc-900 text-zinc-300 border-zinc-700/80 hover:border-lime-400/50 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-lime-400" />
            <span>{isSupabaseConfigured ? 'Supabase' : 'Setup SQL'}</span>
          </button>

          {/* Compact Language Toggle: Hi / En (fits easily with logo on 320px screens) */}
          <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-bold shrink-0">
            <button
              onClick={() => handleLangChange('hinglish')}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition-all ${
                language === 'hinglish'
                  ? 'bg-lime-400 text-zinc-950 shadow font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Hinglish"
            >
              Hi
            </button>
            <button
              onClick={() => handleLangChange('english')}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition-all ${
                language === 'english'
                  ? 'bg-lime-400 text-zinc-950 shadow font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="English"
            >
              En
            </button>
            <button
              onClick={() => handleLangChange('hindi')}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition-all hidden xs:inline-block ${
                language === 'hindi'
                  ? 'bg-lime-400 text-zinc-950 shadow font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="हिंदी"
            >
              हि
            </button>
          </div>

          {/* Admin link badge if admin */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`hidden md:flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-400 text-zinc-950'
                  : 'bg-amber-400/10 text-amber-300 border border-amber-400/30 hover:bg-amber-400/20'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}

          {/* In-App PWA Install button (suppressed when already in standalone mode) */}
          {isInstallable && (
            <button
              onClick={promptInstall}
              title="Install PromptBazaar App"
              className="flex items-center gap-1 bg-lime-400 hover:bg-lime-300 text-zinc-950 text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg shadow-sm shadow-lime-400/20 transition-all active:scale-95 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-black">Install</span>
            </button>
          )}

          {/* User Profile / Login button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-zinc-800 transition-colors shrink-0"
          >
            {user ? (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="w-5 h-5 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center font-bold text-[10px]">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[60px] sm:max-w-[80px] truncate text-[11px] hidden xs:inline">{user.name || user.email.split('@')[0]}</span>
              </div>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-lime-400" />
                <span className="text-[11px] sm:text-xs font-bold">Login</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
