import { useState, useEffect, useRef, useCallback } from 'react';
import { TabId, Capabilities, SystemSnapshot } from './types';
import { fetchCapabilities, fetchSystemSnapshot, isTauriEnvironment } from './services/tauri_bridge';
import { TitleBar } from './components/title_bar';
import { Sidebar } from './components/sidebar';
import { Dashboard } from './components/dashboard';
import { UnmigratedView } from './components/unmigrated_view';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => localStorage.getItem('vxclean_theme') !== 'light');
  const [currentTab, setCurrentTab] = useState<TabId>('dashboard');
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isBrowserPreview = !isTauriEnvironment();
  const isRefreshingRef = useRef<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('vxclean_theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      localStorage.setItem('vxclean_theme', 'light');
    }
  }, [isDark]);

  const loadSnapshot = useCallback(async () => {
    if (isRefreshingRef.current || isBrowserPreview) return;
    isRefreshingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSystemSnapshot();
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : typeof err === 'string' ? err : 'Không thể lấy dữ liệu hệ thống.');
    } finally {
      setIsLoading(false);
      isRefreshingRef.current = false;
    }
  }, [isBrowserPreview]);

  useEffect(() => {
    let active = true;
    fetchCapabilities()
      .then((caps) => {
        if (active) setCapabilities(caps);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Lỗi nạp cấu hình.');
      });

    loadSnapshot();

    return () => {
      active = false;
    };
  }, [loadSnapshot]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-slate-100">
      <TitleBar isDark={isDark} onToggleTheme={() => setIsDark((p) => !p)} isBrowserPreview={isBrowserPreview} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} capabilities={capabilities} isBrowserPreview={isBrowserPreview} />
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentTab === 'dashboard' ? (
            <Dashboard snapshot={snapshot} isLoading={isLoading} error={error} onRefresh={loadSnapshot} isBrowserPreview={isBrowserPreview} />
          ) : (
            <UnmigratedView tab={currentTab} onBackToDashboard={() => setCurrentTab('dashboard')} />
          )}
        </main>
      </div>
    </div>
  );
}
