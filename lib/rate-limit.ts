const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function enforceRateLimit(key: string) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  if (current.count >= MAX_REQUESTS) {
    throw new Error("Rate limit exceeded. Please wait a minute and try again.");
  }

  current.count += 1;
}
