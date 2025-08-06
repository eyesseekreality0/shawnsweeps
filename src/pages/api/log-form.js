// src/pages/api/log-form.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log form data
  console.log('📋 FORM SUBMITTED:', {
    ...req.body,
    timestamp: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  });

  // Send success response
  res.status(200).json({ success: true, message: 'Form logged' });
}
