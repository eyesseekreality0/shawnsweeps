export const CasinoBackground = () => {
  return (
    <>
      {/* Red and Gold Background */}
      <div className="video-background">
        <div className="w-full h-full bg-gradient-to-br from-red-900 via-red-800 to-casino-gold/40"></div>
      </div>
      
      {/* Light overlay for better text readability */}
      <div className="fixed top-0 left-0 w-full h-full bg-black/20 z-[-9]"></div>
      
      {/* Floating casino elements for extra atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-10 left-10 text-casino-gold/30 text-3xl animate-float" style={{ animationDelay: '0s' }}>
          ♠
        </div>
        <div className="absolute top-32 right-20 text-red-400/30 text-3xl animate-float" style={{ animationDelay: '2s' }}>
          ♥
        </div>
        <div className="absolute bottom-32 left-20 text-casino-gold/30 text-3xl animate-float" style={{ animationDelay: '4s' }}>
          ♦
        </div>
        <div className="absolute bottom-20 right-32 text-red-400/30 text-3xl animate-float" style={{ animationDelay: '6s' }}>
          ♣
        </div>
        <div className="absolute top-1/2 left-20 text-casino-gold/20 text-4xl animate-float" style={{ animationDelay: '1s' }}>
          🎰
        </div>
        <div className="absolute top-1/3 right-20 text-casino-gold/20 text-3xl animate-float" style={{ animationDelay: '3s' }}>
          🎲
        </div>
      </div>
    </>
  );
};