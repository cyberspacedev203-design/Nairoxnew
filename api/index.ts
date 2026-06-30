export default async function handler(req: any, res: any) {
  try {
    const url = req.url || '/';
    const host = req.headers?.host || 'localhost';
    const u = new URL(url, `http://${host}`);
    // route is the first path segment after /api/
    let path = u.pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');
    if (!path) path = 'index';
    const [route] = path.split('/');

    // Try to load a handler module from ./_handlers/<route>.js (runtime compiled)
    try {
      const mod = await import(`./_handlers/${route}.js`);
      if (mod && typeof mod.default === 'function') {
        return await mod.default(req, res);
      }
    } catch (err) {
      // If module not found, continue to built-in fallbacks below
    }

    // Fallback built-in small handlers for endpoints that used to exist
    if (route === 'send-welcome') {
      // forward to send-welcome-immediate if available
      try {
        const mod = await import('./_handlers/send-welcome-immediate.js');
        return await mod.default(req, res);
      } catch (err) {
        return res.status(501).json({ error: 'send-welcome unavailable' });
      }
    }

    // Unknown route
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    console.error('api/index error', err);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
