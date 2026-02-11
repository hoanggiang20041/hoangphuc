// Backend Gateway: Save content to GitHub using native fetch (Zero dependencies)
const ADMIN_EMAILS = ["giang10012004@gmail.com", "mchoangphuc2207@gmail.com"];

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { token, path, content } = req.body;

  // Kiểm tra biến môi trường ngay lập tức
  const config = {
    firebaseKey: process.env.FIREBASE_API_KEY,
    githubToken: process.env.GITHUB_TOKEN,
    githubRepo: process.env.GITHUB_REPO
  };

  if (!config.firebaseKey || !config.githubToken || !config.githubRepo) {
    return res.status(500).json({ 
      error: "Server thiếu cấu hình biến môi trường (FIREBASE_API_KEY, GITHUB_TOKEN, hoặc GITHUB_REPO). Hãy kiểm tra Vercel Settings." 
    });
  }

  try {
    // 1. Xác thực Firebase Token
    const authResp = await fetch(`https://identitytoolkit.googleapis.com/v1/getAccountInfo?key=${config.firebaseKey}`, {
      method: 'POST',
      body: JSON.stringify({ idToken: token })
    });
    const authData = await authResp.json();
    const email = authData.users?.[0]?.email;

    if (!email || !ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: `Email ${email || 'không xác định'} không có quyền Admin.` });
    }

    // 2. Lấy SHA của file cũ từ GitHub
    const [owner, repo] = config.githubRepo.split('/');
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    const fileResp = await fetch(getUrl, {
      headers: { 'Authorization': `token ${config.githubToken}` }
    });
    
    let sha;
    if (fileResp.status === 200) {
      const fileData = await fileResp.json();
      sha = fileData.sha;
    }

    // 3. Ghi file mới lên GitHub
    const putResp = await fetch(getUrl, {
      method: 'PUT',
      headers: { 
        'Authorization': `token ${config.githubToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Admin Update: ${path} by ${email}`,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
        sha: sha,
        branch: "main"
      })
    });

    if (putResp.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errorData = await putResp.json();
      return res.status(500).json({ error: "GitHub API Error: " + (errorData.message || 'Unknown') });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
