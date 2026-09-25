export async function onRequestPost({ env }) {
  if (!env.VISITS_DB) {
    return Response.json({ error: 'Counter is not configured' }, { status: 503 });
  }

  try {
    await env.VISITS_DB.prepare(
      'CREATE TABLE IF NOT EXISTS page_views (page TEXT PRIMARY KEY, total INTEGER NOT NULL)'
    ).run();

    const total = await env.VISITS_DB.prepare(
      "INSERT INTO page_views (page, total) VALUES ('home', 1) " +
      'ON CONFLICT(page) DO UPDATE SET total = total + 1 RETURNING total'
    ).first('total');

    return Response.json({ total }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    console.error('Could not record page view', error);
    return Response.json({ error: 'Counter unavailable' }, { status: 500 });
  }
}
