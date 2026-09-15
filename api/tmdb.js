const BASE_URL = 'https://api.themoviedb.org/3';

module.exports = async function handler(req, res) {
  try {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    if (!rawPath) return res.status(400).json({ error: 'Missing TMDB path' });

    const cleanPath = String(rawPath).replace(/^\/+/, '');
    if (cleanPath.includes('..') || cleanPath.startsWith('http')) {
      return res.status(400).json({ error: 'Invalid TMDB path' });
    }

    const token = process.env.TMDB_ACCESS_TOKEN;
    const apiKey = process.env.TMDB_API_KEY;

    const url = new URL(`${BASE_URL}/${cleanPath}`);
    Object.entries(req.query || {}).forEach(([key, value]) => {
      if (key === 'path') return;
      if (Array.isArray(value)) value.forEach(v => url.searchParams.append(key, v));
      else if (value !== undefined) url.searchParams.set(key, value);
    });

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (!token && apiKey) url.searchParams.set('api_key', apiKey);

    const response = await fetch(url, { headers });
    const contentType = response.headers.get('content-type') || 'application/json';
    const body = await response.text();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', response.ok ? 's-maxage=3600, stale-while-revalidate=86400' : 'no-store');
    res.status(response.status).send(body);
  } catch (error) {
    res.status(500).json({ error: 'TMDB proxy failed', message: error.message });
  }
};

