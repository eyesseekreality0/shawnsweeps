// src/pages/BuyPage.jsx
import React, { useState, useEffect } from 'react';

const BuyPage = () => {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    username: '',
    game: '',
    phone: '',
    amount: 50,
  });
  const [walletAddress] = useState('0x82b9e1B6D9d3c9b5f85fC8eE85E8aDbF31D6fD9a');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/log-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        console.log('✅ Form data logged');
      }
    } catch (error) {
      console.warn('❌ Failed to log form', error);
    }

    setStep(2);
  };

  useEffect(() => {
    if (step === 2) {
      const script = document.createElement('script');
      script.src = 'https://cdn.wert.io/widget/sandbox/v1.5/wert-widget.min.js';
      script.async = true;

      script.onload = () => {
        if (window.WertWidget) {
          window.WertWidget({
            container: '#crypto-payment-widget',
            partner_id: process.env.REACT_APP_WERT_PARTNER_ID || '01K0FHM9K6ATK1CYCHMV34Z0YG',
            origin: process.env.REACT_APP_WERT_ORIGIN || 'https://shawnsweeps.vercel.app',
            click_id: `deposit_${Date.now()}`,
            width: '100%',
            height: '500px',
            amount: userData.amount,
            currency: 'USD',
            commodity: 'USDT',
            network: process.env.REACT_APP_WERT_NETWORK || 'polygon',
            chain_id: parseInt(process.env.REACT_APP_WERT_CHAIN_ID || '137'),
            address: walletAddress,
          });
        }
      };

      document.body.appendChild(script);

      return () => {
        const scripts = Array.from(document.scripts).filter(s =>
          s.src.includes('wert.io')
        );
        scripts.forEach(s => s.remove());
      };
    }
  }, [step, userData.amount, walletAddress]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'https://sandbox-widget.wert.io') return;
      const { type, data } = event.data;
      if (type === 'purchase.success') {
        alert(`🎉 Success, ${userData.name}! Your deposit of $${userData.amount} has been credited.`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [userData.name, userData.amount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10">
        {step === 1 ? (
          <>
            <h1 className="text-4xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              💳 Make a Deposit
            </h1>
            <p className="text-center text-gray-300 mb-8">Add funds securely with credit card. Instantly credited as sweep balance.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={userData.username}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Game You Play *</label>
                <select
                  name="game"
                  value={userData.game}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                >
                  <option value="">-- Select Game --</option>
                  <option value="sweepstakes">Sweepstakes Casino</option>
                  <option value="slots">Slots</option>
                  <option value="poker">Poker</option>
                  <option value="bingo">Bingo</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Deposit Amount (USD) *</label>
                <input
                  type="number"
                  name="amount"
                  value={userData.amount}
                  onChange={handleChange}
                  min="10"
                  max="500"
                  required
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg font-bold text-lg hover:from-green-700 hover:to-emerald-800 transition transform hover:scale-105 shadow-lg"
              >
                Continue to Payment
              </button>
            </form>
          </>
        ) : (
          <div>
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              ✅ Confirm Your Deposit
            </h2>

            <div className="bg-white/10 p-4 rounded-lg mb-6 border border-white/20">
              <p><strong>Name:</strong> {userData.name}</p>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Amount:</strong> ${userData.amount}</p>
              <p><strong>Wallet:</strong> {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</p>
            </div>

            <p className="text-yellow-200 text-sm mb-4 animate-pulse">
              💳 Use test card: <strong>4242 4242 4242 4242</strong> | CVC: 123 | Any future date
            </p>

            <div
              id="crypto-payment-widget"
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                border: '1px solid #2d3748'
              }}
            ></div>

            <p className="text-xs text-gray-500 mt-4">
              Powered by secure blockchain payment processing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyPage;
