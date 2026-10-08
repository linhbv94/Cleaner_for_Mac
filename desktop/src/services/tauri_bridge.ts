import { Capabilities, SystemSnapshot } from '../types';

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
        smart_scan: false,
        cleanup: false,
        uninstaller: false,
        space_lens: false,
        menu_bar_monitor: false,
      },
      engine_status: 'Môi trường Browser Preview (Chưa kết nối desktop)',
    };
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke<Capabilities>('get_capabilities');
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
