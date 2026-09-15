const BASE_URL = "https://api.opensubtitles.com/api/v1";

module.exports = async function handler(req, res) {
  try {
    const originalUrl = req.url || "";
    const urlObj = new URL(originalUrl, "https://moviematch.local");

    let openSubtitlesPath = originalUrl
      .replace(/^\/api\/opensubtitles\/?/, "")
      .split("?")[0];

    if (!openSubtitlesPath) {
      return res.status(400).json({
        error: "Missing OpenSubtitles path",
        example: "/api/opensubtitles/subtitles?imdb_id=tt1375666&languages=id,en"
      });
    }

    openSubtitlesPath = openSubtitlesPath.replace(/^\/+/, "");

    if (
      openSubtitlesPath.includes("..") ||
      openSubtitlesPath.startsWith("http") ||
      openSubtitlesPath.includes("\\")
    ) {
      return res.status(400).json({ error: "Invalid OpenSubtitles path" });
    }

    const apiKey = process.env.OPENSUBTITLES_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing OPENSUBTITLES_API_KEY"
      });
    }

    const targetUrl = new URL(`${BASE_URL}/${openSubtitlesPath}`);

    urlObj.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    const response = await fetch(targetUrl.toString(), {
      method: req.method || "GET",
      headers: {
        "Api-Key": apiKey,
        "User-Agent": "MovieMatchApp v1.0",
        "Content-Type": "application/json"
      },
      body: ["POST", "PUT", "PATCH"].includes(req.method)
        ? JSON.stringify(req.body || {})
        : undefined
    });

    const contentType = response.headers.get("content-type") || "application/json";
    const body = await response.text();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");

    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(500).json({
      error: "OpenSubtitles proxy failed",
      message: error.message
    });
  }
};
