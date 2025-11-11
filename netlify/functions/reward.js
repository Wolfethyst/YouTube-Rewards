// netlify/functions/reward.js
// ---------------------------------------------------------------
// Bridge between the front‑end and your Cloudflare tunnel → Streamer Bot
// ---------------------------------------------------------------

exports.handler = async (event) => {
  const method = event.httpMethod;
  const headers = { "Content-Type": "application/json" };

  // Helper to format JSON responses
  const json = (obj, status = 200) => ({
    statusCode: status,
    headers,
    body: JSON.stringify(obj),
  });

  // -----------------------------------------------------------
  // 1️⃣ Secret token – keep it in sync with index.html
  //    (You can also store it as a Netlify env var called SECRET_TOKEN)
  // -----------------------------------------------------------
  const EXPECTED_TOKEN = process.env.SECRET_TOKEN || "c4id3n-7x9-qrty-2bmv";

  // -----------------------------------------------------------
  // 2️⃣ Simple token validator
  // -----------------------------------------------------------
  const validateToken = (provided) => !!provided && provided === EXPECTED_TOKEN;

  // -----------------------------------------------------------
  // 3️⃣ GET – return a mock point balance (replace with real DB later)
  // -----------------------------------------------------------
  if (method === "GET") {
    const qs = new URLSearchParams(event.queryStringParameters);
    const ytId = qs.get("yt");
    const action = qs.get("action"); // expecting "getPoints"
    const token = qs.get("token");

    if (!validateToken(token)) {
      return json({ error: "Invalid token" }, 403);
    }

    // ---- TODO: replace this static value with a DB lookup ----
    const points = 250; // placeholder
    return json({ points });
  }

  // -----------------------------------------------------------
  // 4️⃣ POST – forward reward request to Streamer Bot via Cloudflare tunnel
  // -----------------------------------------------------------
  if (method === "POST") {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return json({ error: "Malformed JSON" }, 400);
    }

    const { ytId, rewardId, token } = body;

    if (!validateToken(token)) {
      return json({ error: "Invalid token" }, 403);
    }

    // -------------------------------------------------------
    // OPTIONAL: Here you could deduct points, check balances, etc.
    // -------------------------------------------------------

    // -------------------------------------------------------
    // 5️⃣ Forward to the tunnel (your public sub‑domain)
    // -------------------------------------------------------
    const TUNNEL_HOST = "https://youtuberewards.wolfethyst.tv"; // <-- your tunnel domain
    const botUrl = `${TUNNEL_HOST}/action/execute?name=${encodeURIComponent(rewardId)}`;

    try {
      const resp = await fetch(botUrl);
      const txt = await resp.text();

      if (!resp.ok) {
        throw new Error(`Bot returned ${resp.status}`);
      }

      // ---------------------------------------------------
      // 6️⃣ Success – you can also return the new point total
      // ---------------------------------------------------
      return json({
        success: true,
        remaining: 250, // placeholder – replace with real calculation if you store points
        botResponse: txt,
      });
    } catch (err) {
      console.error("Bridge error:", err);
      return json({ error: `Could not reach Streamer Bot: ${err.message}` }, 502);
    }
  }

  // -----------------------------------------------------------
  // 7️⃣ Anything else → Method Not Allowed
  // -----------------------------------------------------------
  return json({ error: "Method not allowed" }, 405);
};