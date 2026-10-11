import React, { useState } from 'react';
import { Sparkles, Shield, User, Search, Database, Download, X, LogOut, Check, ArrowRight } from 'lucide-react';
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
  const { user, isAdmin, signOut } = useAuth();
  const { isInstallable, promptInstall } = usePWAInstall();
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-3 py-2.5 w-full max-w-full">
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between gap-2">
        {/* Logo */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 group text-left transition-transform active:scale-95 shrink min-w-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-zinc-950 shadow-md shadow-lime-400/20 font-black shrink-0">
            <Sparkles className="w-4 h-4 fill-zinc-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-base font-black tracking-tight text-white group-hover:text-lime-400 transition-colors truncate">
                {APP_CONFIG.name}
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/30 shrink-0">
                AI
              </span>
            </div>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Search Toggle Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            title="Search Prompts"
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
              showSearch || searchQuery.trim()
                ? 'bg-lime-400 text-zinc-950 font-bold'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Compact Language Toggle: Hi / En */}
          <div className="flex items-center bg-zinc-900 p-0.5 rounded-xl border border-zinc-800 text-[10px] font-bold">
            <button
              onClick={() => handleLangChange('hinglish')}
              className={`px-1.5 py-1 rounded-lg transition-all ${
                language === 'hinglish'
                  ? 'bg-lime-400 text-zinc-950 shadow-sm font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hi
            </button>
            <button
              onClick={() => handleLangChange('english')}
              className={`px-1.5 py-1 rounded-lg transition-all ${
                language === 'english'
                  ? 'bg-lime-400 text-zinc-950 shadow-sm font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              En
            </button>
          </div>

          {/* Install PWA Button (Auto-hides if not supported or already installed) */}
          {isInstallable && (
            <button
              onClick={promptInstall}
              title="Install PromptBazaar App"
              className="w-8 h-8 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 flex items-center justify-center shadow-sm shadow-lime-400/20 active:scale-90 transition-all"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}

          {/* User Profile / Login button */}
          <button
            onClick={() => {
              if (user) {
                setShowUserMenu(!showUserMenu);
              } else {
                onOpenAuth();
              }
            }}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold px-2 py-1.5 rounded-xl border border-zinc-800 transition-colors active:scale-95"
          >
            {user ? (
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-lime-400 text-zinc-950 flex items-center justify-center font-black text-[10px]">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                {isAdmin && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Admin" />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-lime-400" />
                <span className="text-[11px] font-bold">Login</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {showSearch && (
        <div className="max-w-md sm:max-w-xl mx-auto pt-2 pb-0.5 animate-fadeIn">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts (e.g. Wedding, Royal, Thar, Retro)..."
              autoFocus
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400/80 transition-colors font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-zinc-500 hover:text-zinc-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile User Profile Sheet / Menu */}
      {showUserMenu && user && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setShowUserMenu(false)} />
          <div className="relative w-full max-w-sm bg-zinc-950 rounded-t-3xl sm:rounded-3xl border border-zinc-800 p-4 space-y-3 z-10 shadow-2xl animate-slideUp">
            {/* User Info Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-lime-400 text-zinc-950 flex items-center justify-center font-black text-sm shrink-0">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user.name || user.email.split('@')[0]}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowUserMenu(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Admin Badge */}
            {isAdmin && (
              <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Verified Admin Access
                </span>
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              </div>
            )}

            {/* Menu Actions */}
            <div className="space-y-1.5 pt-1 text-left">
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setActiveTab('admin');
                  }}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-between border border-zinc-800 transition-colors"
                >
                  <span className="flex items-center gap-2 text-amber-300">
                    <Shield className="w-4 h-4 text-amber-400" />
                    Open Admin Panel
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenSqlModal();
                  }}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-between border border-zinc-800 transition-colors"
                >
                  <span className="flex items-center gap-2 text-zinc-300">
                    <Database className="w-4 h-4 text-lime-400" />
                    Supabase SQL Guide
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {isSupabaseConfigured ? 'Connected' : 'Guide'}
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setActiveTab('unlocks');
                }}
                className="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-between border border-zinc-800 transition-colors"
              >
                <span className="flex items-center gap-2 text-zinc-300">
                  <Sparkles className="w-4 h-4 text-lime-400" />
                  My Unlocked Prompts
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              <button
                onClick={async () => {
                  setShowUserMenu(false);
                  await signOut();
                }}
                className="w-full p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs flex items-center gap-2 transition-colors mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
