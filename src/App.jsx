// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import BuyPage from './pages/BuyPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <nav className="bg-black/50 backdrop-blur-lg border-b border-white/20 p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-white">ShawnSweeps</Link>
            <Link
              to="/buy"
              className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-2 rounded-full font-semibold text-white shadow-lg hover:from-green-700 hover:to-blue-700 transition transform hover:scale-105"
            >
              💳 Make a Deposit
            </Link>
          </div>
        </nav>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/buy" element={<BuyPage />} />
          </Routes>
        </main>

        <footer className="bg-black/50 text-center p-4 text-gray-400 text-sm">
          © 2025 ShawnSweeps. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to ShawnSweeps</h1>
        <p className="text-xl mb-8">Win big with exciting sweepstakes games!</p>
        <Link
          to="/buy"
          className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl"
        >
          💳 Make a Deposit
        </Link>
      </div>
    </div>
  );
}

export default App;
