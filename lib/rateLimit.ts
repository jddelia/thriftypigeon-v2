const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

const hits = new Map<string, { count: number; expiresAt: number }>();

export function isRateLimited(key: string) {
  const now = Date.now();
  const record = hits.get(key);

  if (!record || record.expiresAt < now) {
    hits.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return false;
  }

  record.count += 1;
  hits.set(key, record);
  return record.count > MAX_REQUESTS;
}
