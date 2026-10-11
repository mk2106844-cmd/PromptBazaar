import React from 'react';
import { Check, Sparkles } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-lime-400 text-zinc-950 font-bold text-xs shadow-2xl shadow-lime-400/30 border border-lime-300 animate-in fade-in slide-in-from-top-4 duration-200">
      <Check className="w-4 h-4 stroke-[3]" />
      <span>{message}</span>
    </div>
  );
};
