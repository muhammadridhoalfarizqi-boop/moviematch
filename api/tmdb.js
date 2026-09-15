const BASE_URL = "https://api.themoviedb.org/3";

module.exports = async function handler(req, res) {
  try {
    const originalUrl = req.url || "";
    const urlObj = new URL(originalUrl, "https://moviematch.local");

    let tmdbPath = originalUrl
      .replace(/^\/api\/tmdb\/?/, "")
      .split("?")[0];

    if (!tmdbPath) {
      return res.status(400).json({
        error: "Missing TMDB path",
        example: "/api/tmdb/movie/popular?language=id-ID&page=1"
      });
    }

    tmdbPath = tmdbPath.replace(/^\/+/, "");

    if (
      tmdbPath.includes("..") ||
      tmdbPath.startsWith("http") ||
      tmdbPath.includes("\\")
    ) {
      return res.status(400).json({ error: "Invalid TMDB path" });
    }

    const targetUrl = new URL(`${BASE_URL}/${tmdbPath}`);

    urlObj.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    const token = process.env.TMDB_ACCESS_TOKEN;
    const apiKey = process.env.TMDB_API_KEY;

    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (apiKey) {
      targetUrl.searchParams.set("api_key", apiKey);
    } else {
      return res.status(500).json({
        error: "Missing TMDB_ACCESS_TOKEN or TMDB_API_KEY"
      });
    }

    const response = await fetch(targetUrl.toString(), { headers });
    const contentType = response.headers.get("content-type") || "application/json";
    const body = await response.text();

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Cache-Control",
      response.ok ? "s-maxage=3600, stale-while-revalidate=86400" : "no-store"
    );

    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(500).json({
      error: "TMDB proxy failed",
      message: error.message
    });
  }
};
