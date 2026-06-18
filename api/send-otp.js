import nodemailer from 'nodemailer';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Thiếu email.' });

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const secretKey = process.env.GITHUB_TOKEN || 'fallback_secret_key';

  if (!emailUser || !emailPass) {
    return res.status(500).json({ error: 'Server chưa cấu hình Email gửi tự động.' });
  }

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Create an expiration window (e.g., 5 minutes)
  const expires = Date.now() + 5 * 60 * 1000;

  // Hash the OTP and Expiration together with the secret key
  const dataToHash = `${email}:${otp}:${expires}`;
  const hash = crypto.createHmac('sha256', secretKey).update(dataToHash).digest('hex');
  
  // The final token to send to frontend will contain the hash and expiration
  const token = `${hash}.${expires}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: emailUser, pass: emailPass }
  });

  const mailOptions = {
    from: `"Admin System" <${emailUser}>`,
    to: email,
    subject: `Mã bảo mật đăng nhập Admin: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Xác minh bảo mật đăng nhập</h2>
        <p>Mã xác minh của bạn là:</p>
        <div style="font-size: 32px; font-weight: bold; text-align: center; margin: 20px 0; color: #D4AF37; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>Mã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">Hệ thống gửi tự động từ Website MC Hoàng Phúc.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, hash: token });
  } catch (err) {
    console.error("Lỗi gửi OTP mail:", err);
    return res.status(500).json({ error: 'Không thể gửi email OTP.' });
  }
}
