import { retainedRead, invalidatingMutation } from './scan_retention';
import {
  Capabilities,
  SystemSnapshot,
  ScanResponse,
  ScanProgressEvent,
  CleanPayload,
  CleanResponse,
  CleanProgressEvent,
  AppsListResponse,
  UninstallPayload,
  SpaceLensResponse,
  LensProgressEvent,
  OrphansResponse,
} from '../types';
import {
  mockScan,
  mockClean,
  mockGetInstalledApps,
  mockUninstallApp,
  mockAnalyzeSpaceLens,
  mockGetOrphans,
  mockCleanOrphans,
  formatBytes,
} from './mock_engine';

export { formatBytes };


export const isTauriEnvironment = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)
  );
};

export async function fetchCapabilities(): Promise<Capabilities> {
  if (!isTauriEnvironment()) {
    return {
      platform: 'browser',
      has_native_engine: false,
      can_monitor_system: false,
      features: {
        system_monitor: false,
        smart_scan: true, // Cho phép trải nghiệm Mock UI
        cleanup: true,
        uninstaller: true,
        space_lens: true,
        menu_bar_monitor: false,
        orphans: true,
      },
      engine_status: 'Môi trường Browser Preview (Sử dụng Mock Engine)',
    };
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<Capabilities>('get_capabilities');
}

export async function fetchSystemSnapshot(): Promise<SystemSnapshot> {
  if (!isTauriEnvironment()) {
    throw new Error(
      'Môi trường Browser Preview: Cần chạy trong ứng dụng Desktop (Tauri) để kết nối Swift engine đọc số liệu hệ thống thực tế.'
    );
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke<SystemSnapshot>('get_system_snapshot');
}

export async function runSmartScan(
  onProgress?: (event: ScanProgressEvent) => void,
  shouldCancel?: () => boolean
): Promise<ScanResponse> {
  return retainedRead('smart_scan', async () => {
    if (!isTauriEnvironment()) { const preview = await mockScan(onProgress, shouldCancel); preview.categories = preview.categories.filter(c => ['system_junk', 'user_caches', 'large_files'].includes(c.category)); preview.total_cleanable_bytes = preview.categories.reduce((n,c) => n+c.total_bytes,0); return preview; }
    return nativeProgress<ScanResponse, ScanProgressEvent>('start_scan', {}, 'scan_progress', onProgress, shouldCancel);
  });
}

export async function runDetailedScan(onProgress?: (event: ScanProgressEvent) => void, shouldCancel?: () => boolean): Promise<ScanResponse> {
  return retainedRead('cleanup', async () => {
    if (!isTauriEnvironment()) {
      const result = await mockScan(onProgress, shouldCancel);
      for (const [category, title] of [['xcode_junk', 'Xcode Junk'], ['ai_apps', 'AI Apps'], ['brew_cache', 'Brew Cache'], ['docker_cache', 'Docker Cache'], ['mail_downloads', 'Mail Files'], ['trash_bin', 'Trash Bins']] as const) {
        if (!result.categories.some(c => c.category === category)) result.categories.push({category, title, description: 'Chưa có dữ liệu trong bản xem trước', total_bytes: 0, item_count: 0, items: []});
      }
      return result;
    }
    return nativeProgress<ScanResponse, ScanProgressEvent>('start_scan', {includeEmpty: true}, 'scan_progress', onProgress, shouldCancel);
  });
}

async function nativeProgress<T, P>(command: string, args: Record<string, unknown>, event: string, onProgress?: (p: P) => void, shouldCancel?: () => boolean): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  const { listen } = await import('@tauri-apps/api/event');
  const operationId = crypto.randomUUID();
  const unlisten = await listen<{ operation_id: string; data: P }>(event, ({ payload }) => {
    if (payload.operation_id === operationId) onProgress?.(payload.data);
  });
  let cancelled = false;
  const timer = shouldCancel ? setInterval(() => {
    if (!cancelled && shouldCancel()) {
      cancelled = true;
      void invoke('cancel_scan', { operationId }).catch(() => { /* Scan result still reports host errors. */ });
    }
  }, 100) : undefined;
  try {
    const result = await invoke<T>(command, { ...args, operationId });
    if (shouldCancel?.()) throw new Error('Đã hủy quét');
    return result;
  } finally { unlisten(); if (timer) clearInterval(timer); }
}

export async function runClean(payload: CleanPayload, onProgress?: (event: CleanProgressEvent) => void): Promise<CleanResponse> {
  return invalidatingMutation(async () => {
    if (!isTauriEnvironment()) return mockClean(payload, onProgress);
    return nativeProgress<CleanResponse, CleanProgressEvent>('clean_items', { payload }, 'clean_progress', onProgress);
  });
}

export async function fetchInstalledApps(): Promise<AppsListResponse> {
  return retainedRead('uninstaller', async () => {
    if (!isTauriEnvironment()) return mockGetInstalledApps();
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<AppsListResponse>('get_installed_apps');
  });
}
export async function runUninstallApp(payload: UninstallPayload): Promise<CleanResponse> {
  return invalidatingMutation(async () => {
    if (!isTauriEnvironment()) return mockUninstallApp(payload);
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<CleanResponse>('uninstall_app', { payload });
  });
}
export async function runAnalyzeSpaceLens(path: string, onProgress?: (event: LensProgressEvent) => void, shouldCancel?: () => boolean): Promise<SpaceLensResponse> {
  return retainedRead('space_lens', async () => {
    if (!isTauriEnvironment()) {
      const result = await mockAnalyzeSpaceLens(path);
      if (shouldCancel?.()) throw new Error('Đã hủy quét');
      return result;
    }
    return nativeProgress<SpaceLensResponse, LensProgressEvent>('analyze_space_lens', {path}, 'lens_progress', onProgress, shouldCancel);
  });
}
export async function chooseScanFolder(): Promise<string | null> {
  if (!isTauriEnvironment()) return null;
  const {invoke} = await import('@tauri-apps/api/core');
  return invoke<string | null>('choose_scan_folder');
}
export async function openFullDiskAccessSettings(): Promise<void> {
  if (!isTauriEnvironment()) return;
  const {invoke} = await import('@tauri-apps/api/core');
  await invoke('open_full_disk_access_settings');
}
export async function trashLensItem(lensId: string, path: string): Promise<CleanResponse> {
  return invalidatingMutation(async () => {
    if (!isTauriEnvironment()) return mockClean({ scan_id: lensId, targets: [{ path, deletion_method: 'trash' }], confirm_direct_delete: false });
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<CleanResponse>('trash_lens_item', { lensId, path });
  });
}
export async function fetchOrphans(): Promise<OrphansResponse> {
  return retainedRead('orphans', async () => {
    if (!isTauriEnvironment()) return mockGetOrphans();
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<OrphansResponse>('get_orphans');
  });
}
export async function runCleanOrphans(selectedPaths: string[]): Promise<CleanResponse> {
  return invalidatingMutation(async () => {
    if (!isTauriEnvironment()) return mockCleanOrphans(selectedPaths);
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<CleanResponse>('clean_orphans', { selectedPaths, confirmDirectDelete: true });
  });
}
export async function revealInFileManager(path: string): Promise<void> {
  if (!isTauriEnvironment()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('reveal_in_file_manager', { path });
}
export async function openInTerminal(path: string): Promise<void> {
  if (!isTauriEnvironment()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('open_in_terminal', { path });
}
export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}


export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {}
  }
  console.log(`[Copied to Clipboard]: ${text}`);
}

export async function minimizeWindow(): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch {}
  }
}

export async function toggleMaximizeWindow(): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    } catch {}
  }
}

export async function closeWindow(): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch {}
  }
}

export async function startDragging(): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().startDragging();
    } catch {}
  }
}

export async function setWindowDecorations(decorations: boolean): Promise<void> {
  if (isTauriEnvironment()) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().setDecorations(decorations);
    } catch {}
  }
}


export async function listenNativeMenuEvents(callbacks: {
  onRefresh: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
}): Promise<() => void> {
  if (isTauriEnvironment()) {
    try {
      const { listen } = await import('@tauri-apps/api/event');
      const u1 = await listen('trigger-refresh', () => callbacks.onRefresh());
      const u2 = await listen('trigger-open-settings', () => callbacks.onOpenSettings());
      const u3 = await listen('trigger-toggle-theme', () => callbacks.onToggleTheme());
      return () => {
        u1();
        u2();
        u3();
      };
    } catch (e) {
      console.warn('Tauri listenNativeMenuEvents failed:', e);
    }
  }
  return () => {};
}

export type AppLifecycleResult = { operation_id?: string; status: string; apps: { bundle_id: string; closed: boolean; reopened: boolean; reopen_status?: string }[] };
export async function prepareCleanupApps(scan_id: string, targets: CleanPayload['targets']): Promise<AppLifecycleResult> {
  if (!isTauriEnvironment()) return {status:'not_needed', apps:[]};
  const {invoke}=await import('@tauri-apps/api/core');
  return invoke('prepare_cleanup_apps', {payload:{scan_id, targets, confirm_app_quit:true}});
}
export async function finishCleanupApps(operation_id: string): Promise<AppLifecycleResult> {
  const {invoke}=await import('@tauri-apps/api/core');
  return invoke('finish_cleanup_apps', {operationId:operation_id});
}
