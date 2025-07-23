export const CasinoBackground = () => {
  return (
    <>
      {/* New Modern Casino Background */}
      <div className="fixed top-0 left-0 w-full h-full z-[-10]">
        <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-800">
          {/* Animated patterns */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 right-1/3 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-28 h-28 bg-purple-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '3s' }}></div>
          </div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
      </div>
      
      {/* Very light overlay for text readability */}
      <div className="fixed top-0 left-0 w-full h-full bg-black/10 z-[-9]"></div>
      
      {/* Floating casino elements for extra atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-10 left-10 text-purple-300/40 text-2xl md:text-3xl animate-float" style={{ animationDelay: '0s' }}>
          ♠
        </div>
        <div className="absolute top-32 right-20 text-pink-300/40 text-2xl md:text-3xl animate-float" style={{ animationDelay: '2s' }}>
          ♥
        </div>
        <div className="absolute bottom-32 left-20 text-indigo-300/40 text-2xl md:text-3xl animate-float" style={{ animationDelay: '4s' }}>
          ♦
        </div>
        <div className="absolute bottom-20 right-32 text-purple-300/40 text-2xl md:text-3xl animate-float" style={{ animationDelay: '6s' }}>
          ♣
        </div>
        <div className="absolute top-1/2 left-20 text-pink-300/30 text-3xl md:text-4xl animate-float" style={{ animationDelay: '1s' }}>
          🎰
        </div>
        <div className="absolute top-1/3 right-20 text-indigo-300/30 text-2xl md:text-3xl animate-float" style={{ animationDelay: '3s' }}>
          🎲
        </div>
      </div>
    </>
  );
};