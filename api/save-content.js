// Backend Gateway: Save HTML or Upload Images to GitHub
const ADMIN_EMAILS = ["giang10012004@gmail.com", "mchoangphuc2207@gmail.com"];

function safeJsonParse(text) {
  try { return { ok: true, json: JSON.parse(text) }; } catch (e) { return { ok: false }; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { token, path, content, isImage } = req.body || {};

  const allowedPaths = new Set([
    'index.html',
    'hoangphuc/index.html',
    'hoangphuc/about.html',
    'skill/dan-chuong-trinh.html',
    'skill/host-livestream.html',
    'skill/voice.html',
  ]);

  const isImgPath = typeof path === 'string' && path.startsWith('img/');
  const isAllowedHtml = typeof path === 'string' && allowedPaths.has(path);

  if (!isImgPath && !isAllowedHtml) {
    return res.status(400).json({
      error: 'Path không hợp lệ. Chỉ cho phép img/* hoặc các file HTML đã whitelist.',
      path,
    });
  }

  if (isImage && !isImgPath) {
    return res.status(400).json({
      error: 'Upload ảnh chỉ cho phép path bắt đầu bằng img/.',
      path,
    });
  }


  const config = {
    firebaseKey: process.env.FIREBASE_API_KEY,
    githubToken: process.env.GITHUB_TOKEN,
    githubRepo: process.env.GITHUB_REPO,
  };

  if (!config.firebaseKey || !config.githubToken || !config.githubRepo) {
    return res.status(500).json({ error: "Server thiếu cấu hình FIREBASE_API_KEY, GITHUB_TOKEN, hoặc GITHUB_REPO." });
  }

  try {
    // 1) Verify Firebase token
    const authResp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.firebaseKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    const authData = await authResp.json();
    const email = authData.users?.[0]?.email;

    if (!email || !ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: `Email ${email || 'không xác định'} không có quyền Admin.` });
    }

    // 2) GitHub logic
    const [owner, repo] = config.githubRepo.split('/');
    const contentUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // Lấy SHA file cũ
    const fileResp = await fetch(contentUrl, {
      headers: { Authorization: `Bearer ${config.githubToken}` },
    });
    let sha;
    if (fileResp.status === 200) {
      const fileData = await fileResp.json();
      sha = fileData.sha;
    }

    // 3) Chuẩn bị nội dung gửi lên GitHub
    let base64Content;
    if (isImage) {
      // content lúc này là string base64 từ frontend gửi lên (bỏ phần data:image/...)
      base64Content = content.split(',')[1] || content;
    } else {
      // content là nội dung file HTML hoặc JSON
      base64Content = Buffer.from(content).toString('base64');
    }

    const putResp = await fetch(contentUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Admin Update: ${path} by ${email}`,
        content: base64Content,
        sha: sha,
        branch: 'main',
      })
    });

    if (putResp.ok) {
      // 4) Tự động đồng bộ hóa nếu là file index
      const syncMap = {
        'index.html': 'hoangphuc/index.html',
        'hoangphuc/index.html': 'index.html'
      };

      if (syncMap[path]) {
        const syncPath = syncMap[path];
        const syncUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${syncPath}`;
        
        // Lấy SHA của file đồng bộ
        const syncFileResp = await fetch(syncUrl, {
          headers: { Authorization: `Bearer ${config.githubToken}` },
        });
        
        let syncSha;
        if (syncFileResp.status === 200) {
          const syncFileData = await syncFileResp.json();
          syncSha = syncFileData.sha;
        }

        await fetch(syncUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${config.githubToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Auto-sync: ${syncPath} from ${path} by ${email}`,
            content: base64Content,
            sha: syncSha,
            branch: 'main',
          })
        });
      }
      return res.status(200).json({ success: true, path: path });
    }
    
    const errData = await putResp.json();
    return res.status(500).json({ error: "GitHub API Error: " + errData.message });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
