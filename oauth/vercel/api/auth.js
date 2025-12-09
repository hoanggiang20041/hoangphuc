// Vercel Serverless Function: /api/auth
// Redirects to GitHub authorize endpoint and stores a CSRF state in a cookie

export default async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const baseUrl = process.env.BASE_URL; // e.g. https://your-oauth.vercel.app

  if (!clientId || !baseUrl) {
    res.status(500).json({ error: 'Missing env GITHUB_CLIENT_ID or BASE_URL' });
    return;
  }

  // Generate a random state
  const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  // Set CSRF state cookie (HttpOnly, short-lived)
  const cookie = `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure`;
  res.setHeader('Set-Cookie', cookie);

  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/callback`;
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'repo,user:email');
  url.searchParams.set('state', state);

  res.status(302).setHeader('Location', url.toString()).end();
}

