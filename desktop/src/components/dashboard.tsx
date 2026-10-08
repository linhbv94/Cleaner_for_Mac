import React from 'react';
import { SystemSnapshot, BatteryMetrics } from '../types';
import { Cpu, HardDrive, Battery, RefreshCw, Layers } from 'lucide-react';

interface DashboardProps {
  snapshot: SystemSnapshot | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  isBrowserPreview: boolean;
}

const fmt = (bytes: number): string => {
  if (bytes <= 0) return '0 B';
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
};

const getBatteryStatus = (b: BatteryMetrics): string => {
  if (!b.has_battery) return 'Không có pin';
  if (b.is_charged) return 'Đã sạc đầy';
  if (b.is_charging) return 'Đang sạc';
  if (b.is_ac_powered) return 'Nguồn AC';
  return 'Đang dùng pin';
};

export const Dashboard: React.FC<DashboardProps> = ({ snapshot, isLoading, error, onRefresh, isBrowserPreview }) => {
  const m = snapshot?.metrics;
  const cpuPct = m ? (m.cpu.usage > 1 ? m.cpu.usage : m.cpu.usage * 100) : 0;

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Tổng quan Hệ thống</h1>
          {snapshot && <p className="text-[11px] text-slate-400 font-mono mt-0.5">Lấy mẫu: {new Date(snapshot.timestamp).toLocaleTimeString()}</p>}
        </div>
        {!isBrowserPreview && (
          <button type="button" onClick={onRefresh} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        )}
      </div>

      {isBrowserPreview && (
        <div className="p-4 rounded-xl glass-card border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 text-center">
          Mở ứng dụng desktop để xem chỉ số hệ thống.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl glass-card border border-rose-500/20 text-xs text-rose-500 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={onRefresh} className="px-2.5 py-1 bg-rose-500 text-white rounded text-xs cursor-pointer font-medium">Thử lại</button>
        </div>
      )}

      {isLoading && !m && !isBrowserPreview && <div className="text-xs text-slate-400 py-12 text-center">Đang tải chỉ số hệ thống...</div>}

      {m && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 rounded-xl border border-black/5 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium"><Cpu className="w-3.5 h-3.5 text-cyan-500" /> CPU</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{cpuPct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, cpuPct)}%` }} />
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-black/5 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium"><Layers className="w-3.5 h-3.5 text-cyan-500" /> RAM</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{fmt(m.memory.used_bytes)} / {fmt(m.memory.total_bytes)}</span>
            </div>
            <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, m.memory.fraction * 100)}%` }} />
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between font-mono pt-1">
              <span>Active: {fmt(m.memory.active_bytes)}</span>
              <span>Wired: {fmt(m.memory.wired_bytes)}</span>
              <span>Comp: {fmt(m.memory.compressed_bytes)}</span>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-black/5 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium"><HardDrive className="w-3.5 h-3.5 text-cyan-500" /> Ổ đĩa</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{fmt(m.disk.used_bytes)} / {fmt(m.disk.total_bytes)}</span>
            </div>
            <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, m.disk.fraction * 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 pt-0.5">{fmt(m.disk.available_bytes)} khả dụng (ước tính có thể gồm purgeable)</p>
          </div>

          <div className="glass-card p-4 rounded-xl border border-black/5 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium"><Battery className="w-3.5 h-3.5 text-cyan-500" /> Nguồn & Pin</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{m.battery.has_battery ? `${m.battery.charge_percent}%` : 'Không có'}</span>
            </div>
            {m.battery.has_battery && (
              <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, m.battery.charge_percent)}%` }} />
              </div>
            )}
            <p className="text-[10px] text-slate-400 pt-0.5">Trạng thái: {getBatteryStatus(m.battery)}</p>
          </div>
        </div>
      )}
    </div>
  );
};
