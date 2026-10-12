import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useConfirmation } from './confirmation_dialog';
import { finishCleanupApps, isTauriEnvironment } from '../services/tauri_bridge';
import { historyEntries, type OperationEntry } from '../services/operation_history_policy';
import { invoke } from '@tauri-apps/api/core';

export function OperationHistory({ mode = 'banner' }: { mode?: 'banner' | 'history' }) {
  const { confirm, dialog } = useConfirmation();
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<OperationEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!isTauriEnvironment()) return;
    let disposed = false;
    const refresh = () => { void invoke<OperationEntry[]>('get_operation_history').then(rows => {
      if (!disposed) { setEntries(rows); setError(null); }
    }).catch(e => { if (!disposed) setError(String(e)); }); };
    refresh(); window.addEventListener('vxclean_operation_history_changed', refresh);
    return () => { disposed = true; window.removeEventListener('vxclean_operation_history_changed', refresh); };
  }, []);
  const visible = historyEntries(entries, mode);
  if (mode === 'banner' && !visible.length && !error) return null;
  const changed = () => window.dispatchEvent(new Event('vxclean_operation_history_changed'));
  const acknowledge = async () => {
    setBusy(true);
    try { for (const entry of visible) await invoke('acknowledge_operation', { operationId: entry.operation_id }); setOpen(false); changed(); }
    catch (e) { setError(String(e)); } finally { setBusy(false); }
  };
  const reopen = async (entry: OperationEntry) => {
    if (!(await confirm('Mở lại các ứng dụng VXClean đã đóng? Không chạy lại thao tác dọn.'))) return;
    setBusy(true);
    try { const result = await finishCleanupApps(entry.operation_id); if (result.status !== 'reopened') setError('Một số ứng dụng chưa mở lại được. Có thể thử lại tại đây.'); changed(); }
    catch (e) { setError(String(e)); } finally { setBusy(false); }
  };
  return <div className={mode === 'banner' ? 'p-2 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-b border-amber-500/20' : 'text-xs text-slate-700 dark:text-slate-300 space-y-3'}>
    {dialog}
    {error && <p className="break-words">Không đọc hoặc cập nhật được lịch sử thao tác: {error}</p>}
    {mode === 'banner' ? <div className="flex items-center justify-between gap-3">
      {visible.length > 0 && <button onClick={() => setOpen(!open)} className="underline">Có thao tác cần kiểm tra — xem kết quả đã ghi ({visible.length})</button>}
      {visible.length > 0 && <button disabled={busy} aria-label="Ẩn thông báo đã xem" title="Ẩn thông báo; vẫn giữ trong lịch sử" onClick={() => void acknowledge()} className="p-1 rounded hover:bg-amber-500/15 disabled:opacity-50"><X className="w-4 h-4" /></button>}
    </div> : <><h4 className="font-semibold text-cyan-700 dark:text-cyan-400">Lịch sử thao tác</h4><p>Kết quả đã ghi được giữ trong 6 tháng. Các thao tác chưa rõ kết quả được giữ để kiểm tra. Ẩn thông báo không xóa lịch sử.</p>{!visible.length && !error && <p>Chưa có thao tác được ghi.</p>}</>}
    {(open || mode === 'history') && <div className="max-h-80 overflow-auto mt-2 space-y-3">{visible.map(entry => <div key={entry.operation_id} className="border border-slate-300/30 dark:border-white/10 rounded-lg p-2 space-y-1">
      <p>{entry.journal_unverified ? 'Journal chưa xác minh được; chưa cho phép cập nhật.' : `Trạng thái: ${entry.native?.status ?? entry.host?.status ?? 'chưa xác định'}`}</p>
      <p className="font-mono text-[10px] break-all">{entry.operation_id}</p>
      {entry.acknowledgement?.acknowledged && <p>Đã ẩn thông báo. Bằng chứng vẫn được giữ.</p>}
      {entry.lifecycle?.status !== 'reopened' && entry.lifecycle?.apps?.some(a => a.quit_requested && !a.reopened) && <button disabled={busy} className="underline" onClick={() => void reopen(entry)}>Mở lại ứng dụng đã đóng</button>}
      {entry.host?.error && <p className="break-words">{entry.host.error}</p>}
      {(entry.retained_targets_count ?? 0) > (entry.native?.targets?.length ?? 0) && <p>Đang hiển thị 200 mục. Bằng chứng đầy đủ được lưu trong journal nén của thao tác này.</p>}
      {entry.native?.targets?.map((target, i) => <p className="font-mono text-[10px] break-all" key={i}>{target.status === 'outcome_unknown' ? 'Chưa xác định kết quả' : target.status} · {target.path}</p>)}
    </div>)}</div>}
  </div>;
}
