const BASE_URL = 'https://api.opensubtitles.com/api/v1';

module.exports = async function handler(req, res) {
  try {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    if (!rawPath) return res.status(400).json({ error: 'Missing OpenSubtitles path' });

    const cleanPath = String(rawPath).replace(/^\/+/, '');
    if (cleanPath.includes('..') || cleanPath.startsWith('http')) {
      return res.status(400).json({ error: 'Invalid OpenSubtitles path' });
    }

    const apiKey = process.env.OPENSUBTITLES_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENSUBTITLES_API_KEY' });

    const url = new URL(`${BASE_URL}/${cleanPath}`);
    Object.entries(req.query || {}).forEach(([key, value]) => {
      if (key === 'path') return;
      if (Array.isArray(value)) value.forEach(v => url.searchParams.append(key, v));
      else if (value !== undefined) url.searchParams.set(key, value);
    });

    const response = await fetch(url, {
      method: req.method || 'GET',
      headers: {
        'Api-Key': apiKey,
        'User-Agent': 'MovieMatchApp v1.0',
        'Content-Type': 'application/json'
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body || {}) : undefined
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const body = await response.text();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    res.status(response.status).send(body);
  } catch (error) {
    res.status(500).json({ error: 'OpenSubtitles proxy failed', message: error.message });
  }
};
      
