import React from 'react';
import { MessageCircle, ShieldAlert, Sparkles, Heart } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { LegalTab } from './LegalModal';
import { useLanguage } from '../context/LanguageContext';
import { useAppSettings } from '../lib/settings';

interface FooterProps {
  onOpenLegal: (tab: LegalTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  const { t } = useLanguage();
  const settings = useAppSettings();

  const currentWhatsapp = settings.whatsappNumber || APP_CONFIG.whatsapp.number;
  const whatsappUrl = `https://wa.me/${currentWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    APP_CONFIG.whatsapp.supportMessage
  )}`;

  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 pt-8 pb-24 px-4 text-xs text-zinc-400">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Important Warning Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-zinc-300 text-[11px] leading-relaxed">
            <span className="font-bold text-amber-400">Dhyan Dein (Important Notice): </span>
            {APP_CONFIG.disclaimer}
          </div>
        </div>

        {/* Brand & WhatsApp Contact */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-black text-white">{APP_CONFIG.name}</span>
              <span className="text-[10px] bg-lime-400/20 text-lime-400 px-1.5 py-0.5 rounded font-bold">
                India
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {APP_CONFIG.tagline}
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 text-emerald-400 font-bold text-xs transition-colors"
          >
            <MessageCircle className="w-4 h-4 fill-emerald-400/20" />
            <span>WhatsApp Support: {currentWhatsapp}</span>
          </a>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2 text-[11px] text-zinc-500 border-t border-zinc-900 pt-4">
          <button
            onClick={() => onOpenLegal('refund')}
            className="hover:text-lime-400 transition-colors"
          >
            Refund Policy
          </button>
          <span>•</span>
          <button
            onClick={() => onOpenLegal('terms')}
            className="hover:text-lime-400 transition-colors"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-lime-400 transition-colors"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            onClick={() => onOpenLegal('disclaimer')}
            className="hover:text-amber-400 transition-colors"
          >
            Photo Privacy Notice
          </button>
        </div>

        <div className="text-center text-[10px] text-zinc-600 pt-2 flex items-center justify-center gap-1">
          <span>© {new Date().getFullYear()} {APP_CONFIG.name}. Built with</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
          <span>for Indian Creators.</span>
        </div>
      </div>
    </footer>
  );
};
