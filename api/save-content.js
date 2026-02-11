// Backend Gateway: Save content to GitHub using native fetch (Zero dependencies)
const ADMIN_EMAILS = ["giang10012004@gmail.com", "mchoangphuc2207@gmail.com"];

function safeJsonParse(text) {
  try {
    return { ok: true, json: JSON.parse(text) };
  } catch (e) {
    return { ok: false };
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { token, path, content } = req.body || {};

  // Kiểm tra biến môi trường ngay lập tức
  const config = {
    firebaseKey: process.env.FIREBASE_API_KEY,
    githubToken: process.env.GITHUB_TOKEN,
    githubRepo: process.env.GITHUB_REPO,
  };

  if (!config.firebaseKey || !config.githubToken || !config.githubRepo) {
    return res.status(500).json({
      error: "Server thiếu cấu hình biến môi trường (FIREBASE_API_KEY, GITHUB_TOKEN, hoặc GITHUB_REPO). Hãy kiểm tra Vercel Settings.",
      missing: {
        FIREBASE_API_KEY: !config.firebaseKey,
        GITHUB_TOKEN: !config.githubToken,
        GITHUB_REPO: !config.githubRepo,
      },
    });
  }

  if (!token || !path) {
    return res.status(400).json({ error: 'Thiếu token hoặc path.' });
  }

  try {
    // 1) Verify Firebase token -> get email
    const authResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.firebaseKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      },
    );

    const authText = await authResp.text();
    const authParsed = safeJsonParse(authText);
    if (!authParsed.ok) {
      console.error('Firebase verify: non-JSON response', authResp.status, authText.slice(0, 300));
      return res.status(500).json({
        error: 'Firebase verify returned non-JSON response',
        status: authResp.status,
        bodyPreview: authText.slice(0, 300),
      });
    }

    if (!authResp.ok) {
      console.error('Firebase verify failed', authResp.status, authParsed.json);
      return res.status(401).json({
        error: 'Firebase verify failed',
        status: authResp.status,
        firebase: authParsed.json,
      });
    }

    const email = authParsed.json.users?.[0]?.email;
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: `Email ${email || 'không xác định'} không có quyền Admin.` });
    }

    // 2) GitHub get sha (if exists)
    const [owner, repo] = config.githubRepo.split('/');
    if (!owner || !repo) {
      return res.status(500).json({ error: 'GITHUB_REPO sai định dạng, phải là owner/repo' });
    }

    if (!String(path).startsWith('admin/data/')) {
      return res.status(400).json({ error: 'Path không hợp lệ (chỉ cho phép admin/data/*).' });
    }

    const contentUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const fileResp = await fetch(contentUrl, {
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        'User-Agent': 'hoangphuc-admin',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    let sha;
    if (fileResp.status === 200) {
      const fileText = await fileResp.text();
      const parsed = safeJsonParse(fileText);
      if (!parsed.ok) {
        console.error('GitHub get content non-JSON', fileResp.status, fileText.slice(0, 300));
        return res.status(500).json({
          error: 'GitHub get content returned non-JSON',
          status: fileResp.status,
          bodyPreview: fileText.slice(0, 300),
        });
      }
      sha = parsed.json.sha;
    } else if (fileResp.status !== 404) {
      const t = await fileResp.text();
      console.error('GitHub get content error', fileResp.status, t.slice(0, 300));
      return res.status(500).json({
        error: 'GitHub get content error',
        status: fileResp.status,
        bodyPreview: t.slice(0, 300),
      });
    }

    // 3) Put content
    const putBody = {
      message: `Admin Update: ${path} by ${email}`,
      content: Buffer.from(JSON.stringify(content ?? {}, null, 2)).toString('base64'),
      branch: 'main',
    };
    if (sha) putBody.sha = sha;

    const putResp = await fetch(contentUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        'User-Agent': 'hoangphuc-admin',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(putBody),
    });

    const putText = await putResp.text();
    const putParsed = safeJsonParse(putText);

    if (!putResp.ok) {
      console.error('GitHub put error', putResp.status, putText.slice(0, 500));
      return res.status(500).json({
        error: 'GitHub API Error',
        status: putResp.status,
        github: putParsed.ok ? putParsed.json : undefined,
        bodyPreview: putParsed.ok ? undefined : putText.slice(0, 300),
      });
    }

    return res.status(200).json({ success: true, github: putParsed.ok ? putParsed.json : undefined });
  } catch (err) {
    console.error('save-content fatal', err);
    return res.status(500).json({ error: err?.message || String(err) });
  }
}
