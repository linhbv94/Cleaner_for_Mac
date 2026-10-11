import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useConfirmation } from './confirmation_dialog';
import { finishCleanupApps, isTauriEnvironment } from '../services/tauri_bridge';
type Entry = { journal_unverified?: boolean; lifecycle?: { status?: string; apps?: { bundle_id: string; quit_requested?: boolean; closed?: boolean; reopened?: boolean }[] }; operation_id: string; host?: { status?: string; error?: string }; native?: { status?: string; targets?: { path: string; status: string }[] } };
export function OperationHistory() {
  const {confirm,dialog}=useConfirmation();
  const [error,setError]=useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!isTauriEnvironment()) return;
    let disposed = false;
    const refresh=()=>{import('@tauri-apps/api/core').then(({ invoke }) => invoke<Entry[]>('get_operation_history')).then(rows => {
      if (!disposed) setEntries(rows.filter(row => row.journal_unverified || row.native?.targets?.some(t=>t.status==='outcome_unknown') || ['planned', 'interrupted'].includes(row.host?.status ?? '') || ['mutating', 'revalidating'].includes(row.native?.status ?? '') || row.lifecycle?.status !== "reopened" && row.lifecycle?.apps?.some(a => a.quit_requested && !a.reopened)));
    }).catch(e => {if(!disposed) setError(String(e));});
    };refresh(); window.addEventListener('vxclean_operation_history_changed',refresh);
    return () => { disposed = true; window.removeEventListener('vxclean_operation_history_changed',refresh); };
  }, []);
  const visible = entries.filter(entry => !dismissed.has(entry.operation_id));
  if (!visible.length && !error) return null;
  const reopen=async(entry:Entry) => { if(!(await confirm("Mở lại các app VXClean đã đóng trước thao tác bị ngắt? Không chạy lại lệnh dọn."))) return; try {const result=await finishCleanupApps(entry.operation_id); if(result.status!=="reopened") {setError("Một số app chưa mở lại được. Giữ mục này để thử lại.");return;} setEntries(rows=>rows.filter(r=>r.operation_id!==entry.operation_id));} catch(e){setError(String(e));} };
  return <div className="p-2 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-b border-amber-500/20">
    {dialog}{error && <p>{error}</p>}
    <div className="flex items-center justify-between gap-3">
      <button onClick={() => setOpen(!open)} className="underline">Có thao tác bị ngắt — xem kết quả đã ghi ({visible.length})</button>
      <button aria-label="Ẩn thông báo thao tác bị ngắt" title="Ẩn thông báo" onClick={() => {setDismissed(new Set([...dismissed, ...visible.map(entry => entry.operation_id)])); setError(null); setOpen(false);}} className="p-1 rounded hover:bg-amber-500/15"><X className="w-4 h-4" /></button>
    </div>
    {open && <div className="max-h-48 overflow-auto mt-2 space-y-2">{visible.map(entry => <div key={entry.operation_id}>
      <p>{entry.journal_unverified && "Journal không xác minh được; chưa cho phép cập nhật. "}Trạng thái: {entry.native?.status ?? entry.host?.status}. App không tự chạy lại thao tác xóa.</p>
      {entry.lifecycle?.status !== "reopened" && entry.lifecycle?.apps?.some(a=>a.quit_requested && !a.reopened) && <button className="underline" onClick={()=>void reopen(entry)}>Mở lại ứng dụng đã đóng</button>}
      {entry.host?.error && <p>{entry.host.error}</p>}
      {entry.native?.targets?.map((target, i) => <p className="font-mono text-[10px]" key={i}>{target.status === 'outcome_unknown' ? 'Chưa xác định kết quả' : target.status} · {target.path}</p>)}
    </div>)}</div>}
  </div>;
}
