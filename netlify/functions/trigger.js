// netlify/functions/trigger.js
// --------------------------------------------------------------
// This function receives the button click, checks a secret token,
// and forwards the request through your Cloudflare tunnel to
// Streamer Bot.
// --------------------------------------------------------------

exports.handler = async (event) => {
  // ------- Parse query parameters -------
  const params = new URLSearchParams(event.rawQueryString);
  const action = params.get('action');
  const token  = params.get('token');

  // ------- 1️⃣ Verify the secret token -------
  // Keep this token in sync with the one embedded in index.html
  const EXPECTED_TOKEN = "c4id3n-7x9-qrty-2bmv";   // ← EDIT (your secret)
  if (token !== EXPECTED_TOKEN) {
    return { statusCode: 403, body: "❌ Forbidden – bad token" };
  }

  // ------- 2️⃣ Destination – your Cloudflare tunnel -------
  // This is the public hostname you bound in step 5 of the tunnel guide.
  const TUNNEL_HOST = "https://youtuberewards.wolfethyst.tv"; // ← EDIT

  // Streamer Bot’s HTTP endpoint that executes an action
  const botUrl = `${TUNNEL_HOST}/action/execute?name=${encodeURIComponent(action)}`;

  // ------- 3️⃣ Forward the request -------
  try {
    const resp = await fetch(botUrl);
    const txt  = await resp.text();

    if (!resp.ok) {
      throw new Error(`Bot returned ${resp.status}`);
    }

    return { statusCode: 200, body: `✅ ${action} sent! (${txt})` };
  } catch (err) {
    console.error("Bridge error:", err);
    return { statusCode: 502, body: `❌ Could not reach Streamer Bot: ${err.message}` };
  }
};