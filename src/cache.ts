import { config } from './config';

interface Entry<T> {
  value?: T;
  fetchedAt: number;
  pending?: Promise<T>;
}

const entries = new Map<string, Entry<unknown>>();

/**
 * Answers straight from memory and fetches again in the background once an
 * answer is older than CACHE_MINUTES, so only the very first request waits on
 * GitHub. If fetching fails, the last good answer keeps being served.
 */
export async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const entry = (entries.get(key) as Entry<T> | undefined) ?? { fetchedAt: 0 };
  entries.set(key, entry);

  const stale = Date.now() - entry.fetchedAt > config.cacheMinutes * 60_000;
  if (stale && !entry.pending) {
    entry.pending = load()
      .then((value) => {
        entry.value = value;
        entry.fetchedAt = Date.now();
        return value;
      })
      .finally(() => {
        entry.pending = undefined;
      });
    // Already has one to show: that one now, the new one next time
    if (entry.value !== undefined) entry.pending.catch((error) => console.error(`Refreshing ${key} failed:`, error));
  }

  if (entry.value !== undefined) return entry.value;
  return entry.pending!;
}
