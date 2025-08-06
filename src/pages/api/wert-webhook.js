// src/pages/api/wert-webhook.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = '0x57466afb5491ee372b3b30d82ef7e7a0583c9e36aef0f02435bd164fe172b1d3'; // Your private key
  const signature = req.headers['x-wert-signature'];
  const payload = JSON.stringify(req.body);

  // Simple HMAC check (Wert uses SHA256)
  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  if (signature !== expected) {
    console.error('❌ Invalid signature:', signature);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, status, amount, currency, commodity, address } = req.body;

  console.log('💰 WERT PAYMENT EVENT:', {
    id,
    status,
    amount,
    currency,
    token: commodity,
    wallet: address,
    timestamp: new Date().toISOString(),
  });

  if (status === 'confirmed') {
    console.log(`✅ CREDIT USER: Order ${id} confirmed for $${amount}`);
    // Here you'd update user balance in DB
  }

  res.status(200).json({ received: true });
}
