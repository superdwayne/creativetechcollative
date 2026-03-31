/**
 * Client-side helper for calling n8n webhooks via the server-side proxy.
 * Credentials are never exposed to the browser.
 */
export async function n8nFetch(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<Response> {
  const res = await fetch('/api/n8n-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, method, body }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `n8n proxy error: ${res.status}`);
  }
  return res;
}
