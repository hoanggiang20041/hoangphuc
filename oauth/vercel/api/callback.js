// Vercel Serverless Function: /api/callback
// Exchanges GitHub OAuth code for access token and posts it back to Decap CMS window

export default async function handler(req, res) {
  try {
    const { code = '', state = '' } = req.query || {};

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const baseUrl = process.env.BASE_URL; // e.g. https://your-oauth.vercel.app

    if (!clientId || !clientSecret || !baseUrl) {
      res.status(500).send('Missing env GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET/BASE_URL');
      return;
    }

    const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/callback`;

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: String(code),
        redirect_uri: redirectUri,
        state: String(state)
      })
    });

    const tokenJson = await tokenRes.json();
    const token = tokenJson.access_token || '';

    // Minimal HTML that sends token to opener window (Decap CMS listens to this postMessage format)
    const html = `<!doctype html><html><body><script>
      (function(){
        var token = ${JSON.stringify(token)};
        var data = { token: token };
        if (window.opener) {
          window.opener.postMessage('authorization:github:success:' + JSON.stringify(data), '*');
          window.close();
        } else {
          document.body.textContent = token ? 'Login success. You can close this tab.' : 'Login failed.';
        }
      })();
    <\/script></body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (e) {
    res.status(500).send('OAuth error');
  }
}

