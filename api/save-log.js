// Backend: Save Security Logs with IP Detection and full CORS
export default async function handler(req, res) {
  // Cấu hình CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Lấy IP thật từ Vercel Header
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'Unknown';

  // Endpoint GET dùng để check IP client khi load trang
  if (req.method === 'GET') {
    return res.status(200).json({ ip });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { event, location, ua, isFatal, email } = req.body || {};
  const config = {
    githubToken: process.env.GITHUB_TOKEN,
    githubRepo: process.env.GITHUB_REPO,
  };

  try {
    const [owner, repo] = config.githubRepo.split('/');
    const path = 'admin/logs.json';
    const logUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const fileResp = await fetch(logUrl, {
      headers: { Authorization: `Bearer ${config.githubToken}` },
    });
    
    let logs = [];
    let sha;
    if (fileResp.status === 200) {
      const fileData = await fileResp.json();
      sha = fileData.sha;
      logs = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'));
    }

    logs.push({
      time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      event,
      ip,
      location,
      userAgent: ua,
      email: email || 'Chưa đăng nhập',
      blocked: !!isFatal
    });

    if (logs.length > 200) logs = logs.slice(-200);

    await fetch(logUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Security Alert: ${event} [${ip}]`,
        content: Buffer.from(JSON.stringify(logs, null, 2)).toString('base64'),
        sha: sha,
        branch: 'main',
      })
    });

    return res.status(200).json({ success: true, ip });
  } catch (err) {
    return res.status(500).json({ error: err.message, ip });
  }
}
