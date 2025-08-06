// src/pages/api/log-form.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, username, game, phone, amount } = req.body;

  console.log('📋 FORM SUBMITTED:', {
    timestamp: new Date().toISOString(),
    name,
    email,
    username,
    game,
    phone,
    amount,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  });

  res.status(200).json({ success: true, message: 'Logged' });
}
