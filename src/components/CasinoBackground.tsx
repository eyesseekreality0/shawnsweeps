export const CasinoBackground = () => {
  return (
    <>
      {/* New Modern Casino Background */}
      <div className="video-background">
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-red-950 to-amber-900">
          {/* Animated patterns */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-casino-gold/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-red-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 right-1/3 w-28 h-28 bg-casino-gold/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
        </div>
      </div>
      
      {/* Light overlay for better text readability */}
      <div className="fixed top-0 left-0 w-full h-full bg-black/20 z-[-9]"></div>
      
      {/* Floating casino elements for extra atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-10 left-10 text-casino-gold/30 text-2xl md:text-3xl animate-float" style={{ animationDelay: '0s' }}>
          ♠
        </div>
        <div className="absolute top-32 right-20 text-red-400/30 text-2xl md:text-3xl animate-float" style={{ animationDelay: '2s' }}>
          ♥
        </div>
        <div className="absolute bottom-32 left-20 text-casino-gold/30 text-2xl md:text-3xl animate-float" style={{ animationDelay: '4s' }}>
          ♦
        </div>
        <div className="absolute bottom-20 right-32 text-red-400/30 text-2xl md:text-3xl animate-float" style={{ animationDelay: '6s' }}>
          ♣
        </div>
        <div className="absolute top-1/2 left-20 text-casino-gold/20 text-3xl md:text-4xl animate-float" style={{ animationDelay: '1s' }}>
          🎰
        </div>
        <div className="absolute top-1/3 right-20 text-casino-gold/20 text-2xl md:text-3xl animate-float" style={{ animationDelay: '3s' }}>
          🎲
        </div>
      </div>
    </>
  );
};