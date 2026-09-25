const COOKIE_NAME = '__Host-portfolio_visitor';
const VISIT_GAP_MS = 2 * 60 * 60 * 1000;
const COOKIE_AGE_SECONDS = 90 * 24 * 60 * 60;
const VISITOR_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function onRequestPost({ request, env }) {
  if (!env.VISITS_DB) {
    return Response.json({ error: 'Counter is not configured' }, { status: 503 });
  }

  const savedId = request.headers.get('Cookie')?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  const returningBrowser = VISITOR_ID.test(savedId || '');
  const visitorId = returningBrowser ? savedId : crypto.randomUUID();
  const now = Date.now();

  try {
    const [, , counter] = await env.VISITS_DB.batch([
      env.VISITS_DB.prepare('DELETE FROM visitor_windows WHERE last_counted_at < ?')
        .bind(now - COOKIE_AGE_SECONDS * 1000),
      env.VISITS_DB.prepare(
        'INSERT INTO visitor_windows (visitor_id, last_counted_at) VALUES (?, ?) ' +
        'ON CONFLICT(visitor_id) DO UPDATE SET last_counted_at = excluded.last_counted_at ' +
        'WHERE visitor_windows.last_counted_at <= ?'
      ).bind(visitorId, now, now - VISIT_GAP_MS),
      env.VISITS_DB.prepare(
        "UPDATE page_views SET total = total + changes() WHERE page = 'home' RETURNING total"
      )
    ]);

    const total = counter.results?.[0]?.total;
    if (!Number.isSafeInteger(total)) throw new Error('Missing counter row');

    const headers = new Headers({ 'Cache-Control': 'no-store' });
    if (!returningBrowser) {
      headers.set('Set-Cookie',
        `${COOKIE_NAME}=${visitorId}; Max-Age=${COOKIE_AGE_SECONDS}; Path=/; Secure; HttpOnly; SameSite=Lax`
      );
    }
    return Response.json({ total }, { headers });
  } catch (error) {
    console.error('Could not record visit', error);
    return Response.json({ error: 'Counter unavailable' }, { status: 500 });
  }
}
