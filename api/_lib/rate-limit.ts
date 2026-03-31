/**
 * In-memory sliding window rate limiter for Vercel Edge Functions.
 * No external dependencies required.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const tokenCache = new Map<string, RateLimitEntry>();

// Periodically clean expired entries to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000; // 1 minute

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of tokenCache) {
    if (now > entry.resetAt) {
      tokenCache.delete(key);
    }
  }
}

export class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Check rate limit for a given token.
 * @param token - Unique identifier (user ID or IP)
 * @param limit - Max requests allowed in the interval
 * @param intervalMs - Time window in milliseconds
 * @throws RateLimitError if the limit is exceeded
 */
export function checkRateLimit(
  token: string,
  limit: number,
  intervalMs: number
): void {
  cleanup();

  const now = Date.now();
  const entry = tokenCache.get(token);

  if (!entry || now > entry.resetAt) {
    tokenCache.set(token, { count: 1, resetAt: now + intervalMs });
    return;
  }

  entry.count++;
  if (entry.count > limit) {
    throw new RateLimitError(entry.resetAt - now);
  }
}

/**
 * Build a 429 Too Many Requests response.
 */
export function rateLimitResponse(err: RateLimitError): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(err.retryAfterMs / 1000)),
      },
    }
  );
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
