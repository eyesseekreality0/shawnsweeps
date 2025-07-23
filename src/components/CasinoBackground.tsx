
export const CasinoBackground = () => {
  return (
    <>
      {/* Luxurious Casino Background - Emerald & Gold Theme */}
      <div className="fixed top-0 left-0 w-full h-full z-[-10]">
        {/* Main gradient background */}
        <div className="w-full h-full bg-gradient-to-br from-red-950 via-slate-900 to-yellow-900">
          
          {/* Animated geometric patterns */}
          <div className="absolute inset-0 opacity-30">
            {/* Large golden orbs */}
            <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-yellow-500/15 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-red-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute top-1/2 right-1/3 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-red-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4.5s' }}></div>
            
            {/* Smaller accent orbs */}
            <div className="absolute top-1/3 left-1/2 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-1/2 right-1/2 w-32 h-32 bg-red-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '6s' }}></div>
          </div>
          
          {/* Diamond pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,215,0,0.1),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(220,38,38,0.1),transparent_50%)]"></div>
          </div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-8 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          
          {/* Elegant light rays */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-yellow-300/20 to-transparent transform rotate-12"></div>
            <div className="absolute top-0 right-1/3 w-1 h-full bg-gradient-to-b from-red-300/20 to-transparent transform -rotate-12"></div>
          </div>
        </div>
      </div>
      
      {/* Ultra-light overlay for perfect text readability */}
      <div className="fixed top-0 left-0 w-full h-full bg-black/15 z-[-9]"></div>
      
      {/* Floating luxury casino elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Card suits with golden colors */}
        <div className="absolute top-10 left-10 text-yellow-400/50 text-2xl md:text-3xl animate-float" style={{ animationDelay: '0s' }}>
          ♠
        </div>
        <div className="absolute top-32 right-20 text-red-400/50 text-2xl md:text-3xl animate-float" style={{ animationDelay: '2s' }}>
          ♥
        </div>
        <div className="absolute bottom-32 left-20 text-yellow-400/50 text-2xl md:text-3xl animate-float" style={{ animationDelay: '4s' }}>
          ♦
        </div>
        <div className="absolute bottom-20 right-32 text-red-400/50 text-2xl md:text-3xl animate-float" style={{ animationDelay: '6s' }}>
          ♣
        </div>
        
        {/* Casino game symbols */}
        <div className="absolute top-1/2 left-20 text-yellow-400/40 text-3xl md:text-4xl animate-float" style={{ animationDelay: '1s' }}>
          🎰
        </div>
        <div className="absolute top-1/3 right-20 text-amber-400/40 text-2xl md:text-3xl animate-float" style={{ animationDelay: '3s' }}>
          🎲
        </div>
        <div className="absolute bottom-1/3 left-1/2 text-red-400/40 text-2xl md:text-3xl animate-float" style={{ animationDelay: '5s' }}>
          🃏
        </div>
        
        {/* Additional floating elements for richness */}
        <div className="absolute top-1/4 right-1/4 text-yellow-300/30 text-lg md:text-xl animate-float" style={{ animationDelay: '7s' }}>
          ⭐
        </div>
        <div className="absolute bottom-1/4 left-1/4 text-red-300/30 text-lg md:text-xl animate-float" style={{ animationDelay: '8s' }}>
          💎
        </div>
        <div className="absolute top-3/4 right-1/3 text-amber-300/30 text-lg md:text-xl animate-float" style={{ animationDelay: '9s' }}>
          🏆
        </div>
      </div>
      
      {/* Subtle animated border glow effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/20 to-transparent animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </>
  );
};
