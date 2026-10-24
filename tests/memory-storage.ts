// Minimal in-memory localStorage installed on globalThis.window for node tests.
export function installMemoryStorage(): Map<string, string> {
  const data = new Map<string, string>();
  const storage = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() { return data.size; },
  };
  (globalThis as any).window = { localStorage: storage };
  (globalThis as any).localStorage = storage;
  return data;
}
