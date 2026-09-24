// Proxy for the LI.FI API so the API key never reaches the browser.
// vercel.json rewrites /api/lifi/<path> to /api/lifi?path=<path>; the widget's sdkConfig.apiUrl points here.
export const config = { runtime: 'edge' };

const UPSTREAM = 'https://li.quest/';
const ALLOWED = /^v1\/[A-Za-z0-9/_\-.]+$/;

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.searchParams.get('path') || '';
  if (!ALLOWED.test(path)) return new Response('Not found', { status: 404 });
  url.searchParams.delete('path');

  const headers = new Headers();
  const ct = req.headers.get('content-type');
  if (ct) headers.set('content-type', ct);
  if (process.env.LIFI_API_KEY) headers.set('x-lifi-api-key', process.env.LIFI_API_KEY);

  const upstream = await fetch(UPSTREAM + path + (url.search ? url.search : ''), {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text(),
  });

  const out = new Headers();
  for (const h of ['content-type', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset', 'retry-after']) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
