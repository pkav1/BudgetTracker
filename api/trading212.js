// Vercel serverless proxy for Trading 212 API.
// Env vars required (set in Vercel dashboard):
//   TRADING212_API_KEY    — your Trading 212 API key
//   TRADING212_API_SECRET — reserved for future signed-request flows (not used yet)
//
// Usage (frontend): fetch('/api/trading212?endpoint=equity/portfolio')

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { endpoint } = req.query;
  if (!endpoint) return res.status(400).json({ error: "Missing ?endpoint= parameter" });

  const apiKey = process.env.TRADING212_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "TRADING212_API_KEY is not configured on this deployment" });

  let upstream;
  try {
    upstream = await fetch(`https://live.trading212.com/api/v0/${endpoint}`, {
      headers: { Authorization: apiKey },
    });
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach Trading 212", detail: err.message });
  }

  let body;
  try {
    body = await upstream.json();
  } catch {
    return res.status(502).json({ error: "Trading 212 returned a non-JSON response" });
  }

  return res.status(upstream.status).json(body);
}
