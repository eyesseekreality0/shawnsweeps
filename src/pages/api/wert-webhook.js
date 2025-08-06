// src/pages/api/wert-webhook.js
module.exports = function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('✅ WERT WEBHOOK RECEIVED:', JSON.stringify(req.body, null, 2));

  res.status(200).json({ received: true });
};
