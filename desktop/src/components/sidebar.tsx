import React from 'react';
import { TabId, Capabilities } from '../types';
import { LayoutDashboard, Sparkles, Trash2, PackageMinus, PieChart } from 'lucide-react';

interface SidebarProps {
  currentTab: TabId;
  onSelectTab: (tab: TabId) => void;
  capabilities: Capabilities | null;
  isBrowserPreview: boolean;
}

const NAV_ITEMS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'smart_scan', label: 'Quét nhanh', icon: Sparkles },
  { id: 'cleanup', label: 'Dọn dẹp', icon: Trash2 },
  { id: 'uninstaller', label: 'Gỡ ứng dụng', icon: PackageMinus },
  { id: 'space_lens', label: 'Space Lens', icon: PieChart },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, capabilities }) => (
  <aside className="w-64 border-r border-black/5 dark:border-white/5 bg-slate-100/40 dark:bg-[#141821]/40 flex flex-col justify-between p-2 select-none shrink-0">
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isAvailable = id === 'dashboard' ? true : Boolean(capabilities?.features[id]);
        const isActive = currentTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectTab(id)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
              isActive ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{label}</span>
            {!isAvailable && (
              <span className="ml-auto text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                Chưa chuyển
              </span>
            )}
          </button>
        );
      })}
    </nav>
    <div className="px-2 py-1 text-[10px] text-slate-400 font-mono truncate">{capabilities?.platform ?? 'macos'}</div>
  </aside>
);
