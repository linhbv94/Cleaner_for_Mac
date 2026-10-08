import React from 'react';
import { Sun, Moon, Shield } from 'lucide-react';

interface TitleBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  isBrowserPreview: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  isDark,
  onToggleTheme,
  isBrowserPreview,
}) => {
  return (
    <header
      data-tauri-drag-region
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      className="h-7 pl-[82px] pr-3 flex items-center justify-between border-b border-black/5 dark:border-white/5 select-none text-xs font-medium bg-slate-100/80 dark:bg-[#0f1117]/80 backdrop-blur-md z-40 shrink-0"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Shield className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
        <span className="truncate text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
          VXClean
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          Bản thử
        </span>
      </div>

      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center gap-2"
      >
        {isBrowserPreview && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Browser Preview
          </span>
        )}

        <button
          type="button"
          onClick={onToggleTheme}
          title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
          className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
};
