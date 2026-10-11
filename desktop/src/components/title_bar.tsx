import React, { useState, useRef, useEffect } from 'react';
import { Shield, Settings, Minus, Square, X } from 'lucide-react';
import { minimizeWindow, toggleMaximizeWindow, closeWindow, setWindowDecorations } from '../services/tauri_bridge';

interface TitleBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  isBrowserPreview: boolean;
  onOpenSettings: () => void;
  onRefresh?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  isDark,
  onToggleTheme,
  isBrowserPreview,
  onOpenSettings,
  onRefresh,
}) => {
  const isMac =
    typeof navigator !== 'undefined' &&
    (/Mac|iPod|iPhone|iPad/.test(navigator.platform) || /Macintosh/.test(navigator.userAgent));

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!isMac) {
      setWindowDecorations(false);
    }
  }, [isMac]);

  const menus: Record<string, Array<{ label: string; shortcut?: string; action: () => void }>> = {
    Tệp: [
      ...(onRefresh ? [{ label: 'Làm mới dữ liệu', shortcut: 'Cmd/Ctrl+R', action: onRefresh }] : []),
      { label: 'Cài đặt...', shortcut: 'Cmd/Ctrl+,', action: onOpenSettings },
      { label: 'Đóng cửa sổ', shortcut: 'Alt+F4', action: () => closeWindow() },
    ],
    Xem: [
      { label: isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối', action: onToggleTheme },
    ],
    'Trợ giúp': [
      { label: 'Giới thiệu VXClean...', action: onOpenSettings },
    ],
  };

  return (
    <header
      data-tauri-drag-region
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      className={`h-8 w-full ${
        isMac ? 'pl-[82px] pr-3' : 'pl-2 pr-2'
      } flex items-center justify-between border-b border-black/5 dark:border-white/5 select-none text-xs font-medium bg-slate-100/90 dark:bg-[#0f1117]/90 backdrop-blur-md z-40 shrink-0`}
    >
      {/* Left: Brand (Mac) or Menu Bar (Windows) */}
      <div className="flex items-center gap-2">
        {/* macOS Brand: Icon + App Title (System font) */}
        {isMac && (
          <div className="flex items-center gap-1.5 shrink-0 cursor-default">
            <Shield className="w-4 h-4 text-cyan-500 shrink-0" />
            <span className="truncate text-slate-800 dark:text-slate-200 font-semibold text-xs leading-none">
              VXClean
            </span>
          </div>
        )}

        {/* Windows Menus (Icon & Title hidden per desktop UI standard) */}
        {!isMac && (
          <div ref={menuRef} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties} className="flex items-center gap-0.5 text-slate-700 dark:text-slate-300 shrink-0">
            {Object.keys(menus).map((menuKey) => (
              <div key={menuKey} className="relative">
                <button
                  type="button"
                  onClick={() => setActiveMenu(activeMenu === menuKey ? null : menuKey)}
                  onMouseEnter={() => {
                    if (activeMenu !== null) setActiveMenu(menuKey);
                  }}
                  className={`px-2 py-1 rounded text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${
                    activeMenu === menuKey ? 'bg-black/10 dark:bg-white/15 text-cyan-700 dark:text-cyan-300 font-semibold' : ''
                  }`}
                >
                  {menuKey}
                </button>

                {activeMenu === menuKey && (
                  <div className="absolute left-0 top-full mt-1 min-w-[200px] rounded-lg bg-white dark:bg-slate-900/95 backdrop-blur-md py-1 z-50 shadow-2xl border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-100">
                    {menus[menuKey].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          item.action();
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-3 py-1.5 flex items-center justify-between text-xs hover:bg-cyan-50 dark:hover:bg-cyan-500/20 text-slate-800 dark:text-slate-200 hover:text-cyan-900 dark:hover:text-cyan-200 transition-colors"
                      >
                        <span>{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[10px] text-slate-400 font-mono ml-3">{item.shortcut}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center gap-1.5"
      >
        {isBrowserPreview && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 mr-1">
            Browser Preview
          </span>
        )}



        <button
          type="button"
          onClick={onOpenSettings}
          title="Cài đặt (Cmd+,)"
          className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer leading-none"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Windows style window controls (Hidden on macOS) */}
        {!isMac && (
          <div className="flex items-center ml-2 border-l border-slate-200 dark:border-white/10 pl-1.5">
            <button
              type="button"
              onClick={minimizeWindow}
              className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleMaximizeWindow}
              className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={closeWindow}
              className="p-1 hover:bg-rose-500 hover:text-white text-slate-500 dark:text-slate-400 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
