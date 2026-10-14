import { useState } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { invoke } from '@tauri-apps/api/core';
import { isTauriEnvironment } from '../services/tauri_bridge';
import { useConfirmation } from './confirmation_dialog';

export function UpdatePanel() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Chưa kiểm tra cập nhật.');
  const [installed, setInstalled] = useState(false);
  const { confirm, dialog } = useConfirmation();
  async function inspect() {
    if (busy || installed) return;
    setBusy(true);
    try {
      if (!isTauriEnvironment()) throw new Error('Kiểm tra cập nhật cần chạy trong ứng dụng VXClean.');
      await update?.close(); setUpdate(null);
      const next = await check(); setUpdate(next);
      setStatus(next ? `Có phiên bản ${next.version}.` : 'Bạn đang dùng phiên bản mới nhất.');
    } catch (error) { setStatus(`Không kiểm tra được cập nhật: ${String(error)}`); }
    finally { setBusy(false); }
  }
  async function install() {
    if (!update || busy || !(await confirm(`Tải và cài VXClean ${update.version}? Ứng dụng sẽ kết thúc engine trước khi cài. Khởi động lại sau khi cài xong.`))) return;
    setBusy(true); let prepared = false;
    try {
      await invoke('prepare_for_update'); prepared = true;
      setStatus('Đang tải và xác minh chữ ký bản cập nhật…');
      await update.downloadAndInstall();
      setInstalled(true); setStatus('Đã cài cập nhật. Khởi động lại để dùng phiên bản mới.');
    } catch (error) {
      let recovery = '';
      if (prepared) { try { await invoke('resume_after_update_error'); } catch (resumeError) { recovery = ` Engine chưa tiếp tục: ${String(resumeError)}`; } }
      setStatus(`Cập nhật chưa hoàn tất: ${String(error)}${recovery}`);
    } finally { setBusy(false); }
  }
  return <section aria-label="Cập nhật ứng dụng" className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-3">
    {dialog}<p role="status">{status}</p>
    {update?.body && <p className="whitespace-pre-wrap">{update.body}</p>}
    <div className="flex gap-3 flex-wrap">
      {!installed && <button disabled={busy} onClick={() => void inspect()} className="rounded-lg bg-cyan-600 text-white px-3 py-2 disabled:opacity-50">{busy ? 'Đang xử lý…' : 'Kiểm tra cập nhật'}</button>}
      {update && !installed && <button disabled={busy} onClick={() => void install()} className="rounded-lg border px-3 py-2 disabled:opacity-50">Tải và cài {update.version}</button>}
      {installed && <button onClick={() => void invoke('restart_after_update').catch(error => setStatus(String(error)))} className="rounded-lg bg-cyan-600 text-white px-3 py-2">Khởi động lại VXClean</button>}
    </div>
    <a href="https://github.com/linhbv94/VXClean/releases" target="_blank" rel="noreferrer" className="underline">Xem các bản phát hành trên GitHub</a>
  </section>;
}
