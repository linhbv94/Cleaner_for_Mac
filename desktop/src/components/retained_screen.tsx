import { useEffect, useLayoutEffect, useRef, useState, ReactNode } from 'react';
import { scanRetention, ScanScope } from '../services/scan_retention';

/** Mount lazily and retain React state while hidden; renew stale screens on entry. */
export function RetainedScreen({ active, scope, additionalScope, children }: {
  active: boolean; scope: ScanScope; additionalScope?: ScanScope; children: ReactNode;
}) {
  const [visited, setVisited] = useState(active);
  const [version, setVersion] = useState(0);
  const [revision, setRevision] = useState(0);
  useEffect(() => scanRetention.subscribe(() => setRevision(v => v + 1)), []);
  const wasActive = useRef(active);
  const activeNow = useRef(active);
  activeNow.current = active;
  useLayoutEffect(() => {
    if (active && (!wasActive.current || !visited)) {
      const reusable = scanRetention.reusable(scope) || (additionalScope && scanRetention.reusable(additionalScope));
      if (visited && !reusable) setVersion(v => v + 1);
      setVisited(true);
    }
    wasActive.current = active;
  }, [active, visited, scope, additionalScope]);
  useEffect(() => {
    if (active || !visited) return;
    const remaining = Math.max(scanRetention.expiresIn(scope), additionalScope ? scanRetention.expiresIn(additionalScope) : 0);
    if (!Number.isFinite(remaining)) return;
    const timer = setTimeout(() => {
      if (activeNow.current) return;
      setVisited(false); setVersion(v => v + 1);
    }, remaining);
    return () => clearTimeout(timer);
  }, [active, visited, scope, additionalScope, revision]);
  if (!visited) return null;
  return <div key={version} hidden={!active} aria-hidden={!active} inert={!active} className={active ? 'flex flex-1 min-h-0 flex-col overflow-hidden' : 'hidden'}>{children}</div>;
}
