const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { from_name, email, phone, message } = req.body || {};
  if (!from_name || !email || !message) {
    return res.status(400).json({ error: 'Vui lòng điền đủ Họ tên, Email và Nội dung.' });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;
  const emailUser = process.env.EMAIL_USER; // mchoangphuc2207@gmail.com
  const emailPass = process.env.EMAIL_PASS; // App Password

  if (!githubToken || !githubRepo) {
    return res.status(500).json({ error: 'Server thiếu cấu hình Github.' });
  }

  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const newMessage = {
    id: Date.now().toString(),
    from_name,
    email,
    phone: phone || '',
    message,
    time: now,
    read: false
  };

  try {
    // 1) Lấy messages.json hiện tại từ Github
    const [owner, repo] = githubRepo.split('/');
    const path = 'admin/data/messages.json';
    const contentUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    let messages = [];
    let sha = null;
    
    const fileResp = await fetch(contentUrl, { headers: { Authorization: `Bearer ${githubToken}` } });
    if (fileResp.ok) {
      const fileData = await fileResp.json();
      sha = fileData.sha;
      try {
        const decoded = Buffer.from(fileData.content, 'base64').toString('utf8');
        messages = JSON.parse(decoded);
      } catch(e) { messages = []; }
    }

    // 2) Thêm tin nhắn mới vào đầu mảng
    messages.unshift(newMessage);

    // 3) Lưu lại lên Github
    const base64Content = Buffer.from(JSON.stringify(messages, null, 2)).toString('base64');
    const putResp = await fetch(contentUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Khách hàng ${from_name} vừa gửi liên hệ`,
        content: base64Content,
        sha: sha,
        branch: 'main',
      })
    });

    if (!putResp.ok) {
      const err = await putResp.json();
      throw new Error('Không thể lưu tin nhắn: ' + err.message);
    }

    // 4) Gửi Email tự động cho khách hàng (Nếu có cấu hình Gmail)
    if (emailUser && emailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: emailUser, pass: emailPass }
      });

      const mailOptions = {
        from: `"MC Phúc Trương" <${emailUser}>`,
        to: email,
        subject: 'Cảm ơn bạn đã liên hệ MC Phúc Trương',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://hoanggiang20041.github.io/hoangphuc/img/phuc.png" alt="MC Phúc Trương" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid #bf953f;">
            </div>
            <h2 style="color: #bf953f; text-align: center;">Chào ${from_name},</h2>
            <p>Rất cảm ơn bạn đã quan tâm và để lại lời nhắn cho <strong>MC Phúc Trương</strong>.</p>
            <p>Mình đã nhận được yêu cầu của bạn với nội dung:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #bf953f; margin-bottom: 20px; font-style: italic;">
              "${message}"
            </div>
            <p>Phúc sẽ đọc kỹ và phản hồi bạn qua Email hoặc Số điện thoại (<strong>${phone || 'Không cung cấp'}</strong>) trong thời gian sớm nhất nhé.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 0.9em; color: #666; text-align: center;">
              Trân trọng,<br>
              <strong>MC Phúc Trương - Kiến tạo đẳng cấp sự kiện</strong><br>
              Hotline: 0359 581 896
            </p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
      } catch(mailErr) {
        console.error("Lỗi gửi mail: ", mailErr);
        // Không block response vì việc lưu đã thành công
      }
    }

    return res.status(200).json({ success: true, message: 'Gửi thành công!' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
