// src/pages/api/wert-webhook.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log full webhook payload
  console.log('💰 WERT WEBHOOK RECEIVED:', JSON.stringify(req.body, null, 2));

  // Optional: Verify signature later
  // For now, just log it

  res.status(200).json({ received: true });
}
