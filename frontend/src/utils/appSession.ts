const listeners = new Set<() => void>();
export function restartAppSession(): void { listeners.forEach(listener => listener()); }
export function onAppSessionRestart(listener: () => void): () => void { listeners.add(listener); return () => { listeners.delete(listener); }; }
