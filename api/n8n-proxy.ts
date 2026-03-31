import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'edge',
};

const ALLOWED_HOST_PATTERNS = [
  /^https?:\/\/[^/]*\.app\.n8n\.cloud\//,
  /^https?:\/\/n8n\./,
];

function isAllowedEndpoint(url: string): boolean {
  return ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(url));
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const username = process.env.N8N_BASIC_AUTH_USERNAME;
  const password = process.env.N8N_BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    console.error('[N8N-PROXY] N8N_BASIC_AUTH credentials not configured');
    return new Response(JSON.stringify({ error: 'n8n not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { endpoint: string; method?: string; body?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { endpoint, method = 'GET', body: forwardBody } = body;

  if (!endpoint || typeof endpoint !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing endpoint' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!isAllowedEndpoint(endpoint)) {
    return new Response(JSON.stringify({ error: 'Endpoint not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const credentials = btoa(`${username}:${password}`);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(20000),
    };

    if (forwardBody && method !== 'GET') {
      fetchOptions.body = JSON.stringify(forwardBody);
    }

    const response = await fetch(endpoint, fetchOptions);
    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') || 'application/json' },
    });
  } catch (error) {
    console.error('[N8N-PROXY] Fetch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to reach n8n' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
