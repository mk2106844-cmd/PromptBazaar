import React, { useState } from 'react';
import { X, Copy, Check, Database, Key, Terminal, Sparkles, Layers, ShieldAlert, Wrench } from 'lucide-react';
import { SUPABASE_SETUP_SQL } from '../lib/sql';
import { ADMIN_UPGRADE_SQL, ORDERS_RLS_FIX_SQL } from '../lib/adminSqlMigration';
import { isSupabaseConfigured } from '../lib/supabase';

interface SqlSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlSetupModal: React.FC<SqlSetupModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'fix' | 'upgrade' | 'initial'>('fix');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentSql =
    activeTab === 'fix'
      ? ORDERS_RLS_FIX_SQL
      : activeTab === 'upgrade'
      ? ADMIN_UPGRADE_SQL
      : SUPABASE_SETUP_SQL;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-lime-400/20 text-lime-400 border border-lime-400/30">
                <Database className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-black text-white">
                Supabase SQL Scripts & Migration
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Tables, RLS Security Policies, Buckets, Featured items & Reordering setup.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch: Orders Fix SQL vs Admin Upgrade vs Full Initial */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 mt-3 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('fix')}
            className={`flex-1 py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'fix'
                ? 'bg-lime-400 text-zinc-950 shadow font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Orders & RLS Fix (0A000 Fix)</span>
          </button>
          <button
            onClick={() => setActiveTab('upgrade')}
            className={`flex-1 py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'upgrade'
                ? 'bg-lime-400 text-zinc-950 shadow font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admin Upgrade SQL</span>
          </button>
          <button
            onClick={() => setActiveTab('initial')}
            className={`flex-1 py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'initial'
                ? 'bg-lime-400 text-zinc-950 shadow font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Full Initial SQL</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 text-xs text-zinc-300">
          {/* Connection Status Banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
            isSupabaseConfigured
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-zinc-950 border-zinc-800 text-zinc-300'
          }`}>
            <div className={`w-3 h-3 rounded-full shrink-0 ${isSupabaseConfigured ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <div>
              <p className="font-bold text-white text-xs">
                Status: {isSupabaseConfigured ? '✅ Supabase Live Connected' : '⚡ Local Preview Mode (Interactive)'}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isSupabaseConfigured
                  ? 'App is reading and writing directly to your Supabase cloud database.'
                  : 'App preview mode mein chal rahi hai. Supabase me chalane ke liye SQL editor me neeche diya script run karein.'}
              </p>
            </div>
          </div>

          {/* SQL Editor Run Section */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-lime-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Terminal className="w-4 h-4" />
                <span>
                  {activeTab === 'upgrade'
                    ? 'Re-Run in Supabase SQL Editor (Admin Upgrade):'
                    : 'Run in Supabase SQL Editor (Initial Setup):'}
                </span>
              </h4>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-lime-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Supabase Dashboard ➔ <strong className="text-white">SQL Editor</strong> ➔ <strong className="text-white">New Query</strong> ➔ Paste aur <strong className="text-lime-400">RUN</strong> dabayein.
            </p>

            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-300 max-h-52 overflow-y-auto select-all leading-relaxed">
              {currentSql}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            All write actions are protected by database Row Level Security.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-lime-400 text-zinc-950 font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
