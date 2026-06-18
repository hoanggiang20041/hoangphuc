import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, code, hash } = req.body || {};
  if (!email || !code || !hash) {
    return res.status(400).json({ error: 'Thiếu thông tin xác minh.' });
  }

  const secretKey = process.env.GITHUB_TOKEN || 'fallback_secret_key';

  try {
    const parts = hash.split('.');
    if (parts.length !== 2) {
      return res.status(400).json({ success: false, error: 'Mã hash không hợp lệ.' });
    }

    const [expectedHash, expiresStr] = parts;
    const expires = parseInt(expiresStr, 10);

    if (Date.now() > expires) {
      return res.status(200).json({ success: false, error: 'Mã xác minh đã hết hạn.' });
    }

    const dataToHash = `${email}:${code}:${expires}`;
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataToHash).digest('hex');

    if (calculatedHash === expectedHash) {
      return res.status(200).json({ success: true, message: 'Xác minh thành công.' });
    } else {
      return res.status(200).json({ success: false, error: 'Mã xác minh không chính xác.' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi server khi xác minh.' });
  }
}
