import React from 'react';
import { HardDrive, AlertTriangle, CheckCircle, Database } from 'lucide-react';

interface StorageUsageBarProps {
  usedMB: number;
  totalMB: number;
  percentage: number;
  isWarning: boolean;
  onRefresh?: () => void;
}

export const StorageUsageBar: React.FC<StorageUsageBarProps> = ({
  usedMB,
  totalMB,
  percentage,
  isWarning,
}) => {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isWarning
        ? 'bg-red-500/10 border-red-500/40 shadow-lg shadow-red-950/20'
        : percentage >= 60
        ? 'bg-amber-500/10 border-amber-500/30'
        : 'bg-zinc-900 border-zinc-800'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg ${
            isWarning
              ? 'bg-red-500/20 text-red-400'
              : percentage >= 60
              ? 'bg-amber-500/20 text-amber-300'
              : 'bg-lime-400/20 text-lime-400'
          }`}>
            <HardDrive className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Cloud Storage Usage (Supabase Media Bucket)</span>
              {isWarning && (
                <span className="text-[10px] bg-red-500 text-white font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                  &gt; 80% High
                </span>
              )}
            </h4>
            <p className="text-[11px] text-zinc-400">
              Limit: 1 GB (1,024 MB) free tier storage quota
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-black font-mono text-white">
            {usedMB} MB{' '}
            <span className="text-zinc-500 text-xs font-normal">/ {totalMB} MB</span>
          </span>
          <span className={`block text-[11px] font-bold ${
            isWarning ? 'text-red-400' : percentage >= 60 ? 'text-amber-400' : 'text-lime-400'
          }`}>
            {percentage}% Used
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden relative">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isWarning
              ? 'bg-gradient-to-r from-amber-500 to-red-500'
              : percentage >= 60
              ? 'bg-gradient-to-r from-lime-400 to-amber-400'
              : 'bg-gradient-to-r from-emerald-400 to-lime-400'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {/* Warning Notice above 80% */}
      {isWarning && (
        <div className="mt-3 p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            <strong>⚠️ Dhyan Dein:</strong> 80% se zyada storage use ho chuka hai ({percentage}%). Kripya purane ya draft video/photo files delete karein taaki naye uploads fail na hon.
          </span>
        </div>
      )}
    </div>
  );
};
