// Vercel serverless proxy for Trading 212 API.
// Env vars required (set in Vercel dashboard):
//   TRADING212_API_KEY    — your Trading 212 API key
//
// Usage (frontend): fetch('/api/trading212?endpoint=equity/portfolio')

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const endpoint = new URL(req.url, "https://x").searchParams.get("endpoint");
    if (!endpoint) return res.status(400).json({ error: "Missing ?endpoint= parameter" });

    const apiKey = process.env.TRADING212_API_KEY;
    const apiSecret = process.env.TRADING212_API_SECRET;
    if (!apiKey || !apiSecret) return res.status(500).json({ error: "TRADING212_API_KEY or TRADING212_API_SECRET is not configured on this deployment" });

    const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;

    let upstream;
    try {
      upstream = await fetch(`https://live.trading212.com/api/v0/${endpoint}`, {
        headers: { Authorization: authHeader },
      });
    } catch (err) {
      return res.status(502).json({ error: "Failed to reach Trading 212", detail: err.message });
    }

    // Read the raw body text first so we can log it before attempting JSON.parse
    const rawText = await upstream.text();
    console.log("[trading212] upstream status:", upstream.status);
    console.log("[trading212] upstream body (first 200 chars):", rawText.slice(0, 200));

    let body;
    try {
      body = JSON.parse(rawText);
    } catch (err) {
      return res.status(502).json({
        error: "Trading 212 returned a non-JSON response",
        status: upstream.status,
        preview: rawText.slice(0, 200),
      });
    }

    return res.status(upstream.status).json(body);
  } catch (err) {
    console.error("[trading212] unhandled error:", err);
    return res.status(500).json({
      error: "Unhandled error in proxy function",
      message: err.message,
      stack: err.stack,
    });
  }
}
