import { Octokit } from "@octokit/rest";

// Cấu hình Admin Email Allowlist
const ADMIN_EMAILS = ["giang10012004@gmail.com", "mchoangphuc2207@gmail.com"];

export default async function handler(req, res) {
  // Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token, path, content } = req.body;

  if (!token || !path || !content) {
    return res.status(400).json({ error: "Thiếu dữ liệu gửi lên (token, path, hoặc content)." });
  }

  try {
    // 1. Xác thực Token từ Firebase qua Identity Toolkit API
    const firebaseResp = await fetch(`https://identitytoolkit.googleapis.com/v1/getAccountInfo?key=${process.env.FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token })
    });
    
    const firebaseData = await firebaseResp.json();
    const userEmail = firebaseData.users?.[0]?.email;

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return res.status(403).json({ error: `Unauthorized: Email ${userEmail || 'không xác định'} không có quyền Admin.` });
    }

    // 2. Khởi tạo GitHub Octokit
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) {
      return res.status(500).json({ error: "Server thiếu cấu hình GITHUB_TOKEN hoặc GITHUB_REPO." });
    }

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const [owner, repo] = process.env.GITHUB_REPO.split('/');

    // 3. Lấy SHA của file cũ (bắt buộc để cập nhật nội dung trên GitHub)
    let sha;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      sha = data.sha;
    } catch (e) {
      // File chưa tồn tại, sẽ tạo mới (không cần sha)
    }

    // 4. Commit file lên GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Admin Update: ${path} by ${userEmail}`,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
      sha,
      branch: "main"
    });

    return res.status(200).json({ success: true, message: "Đã lưu thành công lên GitHub." });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
