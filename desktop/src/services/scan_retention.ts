export const SCAN_RETENTION_MS = 5 * 60 * 1000;
export type ScanScope = 'smart_scan' | 'cleanup' | 'uninstaller' | 'space_lens' | 'orphans';
type Entry = { generation: number; completedAt?: number; pending: number };

/** Session memory only; cache freshness never authorizes a filesystem mutation. */
export class ScanRetention {
  private generation = 0;
  private listeners = new Set<() => void>();
  subscribe(listener: () => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private notify() { this.listeners.forEach(listener => listener()); }
  private entries = new Map<ScanScope, Entry>();
  private now: () => number;
  constructor(now: () => number = Date.now) { this.now = now; }
  begin(scope: ScanScope) {
    const entry = { generation: this.generation, pending: 1 };
    this.entries.set(scope, entry);
    this.notify();
    return entry;
  }
  finish(scope: ScanScope, entry: Entry, successful: boolean) {
    entry.pending = 0;
    if (this.entries.get(scope) === entry && successful && entry.generation === this.generation) {
      entry.completedAt = this.now();
    }
    this.notify();
  }
  reusable(scope: ScanScope) {
    const entry = this.entries.get(scope);
    return Boolean(entry && entry.generation === this.generation &&
      (entry.pending > 0 || (entry.completedAt !== undefined && this.now() - entry.completedAt < SCAN_RETENTION_MS)));
  }
  expiresIn(scope: ScanScope) {
    const entry = this.entries.get(scope);
    if (!entry || entry.generation !== this.generation) return 0;
    if (entry.pending) return Infinity;
    return entry.completedAt === undefined ? 0 : Math.max(0, SCAN_RETENTION_MS - (this.now() - entry.completedAt));
  }
  invalidate() { this.generation++; this.notify(); }
}
export const scanRetention = new ScanRetention();
export async function retainedRead<T>(scope: ScanScope, work: () => Promise<T>): Promise<T> {
  const entry = scanRetention.begin(scope);
  let successful = false;
  try { const result = await work(); successful = true; return result; }
  finally { scanRetention.finish(scope, entry, successful); }
}
export async function invalidatingMutation<T>(work: () => Promise<T>): Promise<T> {
  // Invalidate before and after, also for partial failure or rejected IPC.
  scanRetention.invalidate();
  try { return await work(); }
  finally { scanRetention.invalidate(); }
}
