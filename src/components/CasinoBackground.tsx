export const CasinoBackground = () => {
  return (
    <>
      {/* Floating Casino Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Floating Cards */}
        <div className="absolute top-10 left-10 text-casino-gold/20 text-4xl animate-card-flip" style={{ animationDelay: '0s' }}>
          ♠
        </div>
        <div className="absolute top-32 right-20 text-casino-red/20 text-3xl animate-card-flip" style={{ animationDelay: '1s' }}>
          ♥
        </div>
        <div className="absolute top-64 left-1/4 text-casino-gold/20 text-3xl animate-card-flip" style={{ animationDelay: '2s' }}>
          ♦
        </div>
        <div className="absolute top-96 right-1/3 text-casino-red/20 text-4xl animate-card-flip" style={{ animationDelay: '3s' }}>
          ♣
        </div>
        
        {/* Floating Dice */}
        <div className="absolute top-20 right-10 text-casino-gold/30 text-5xl animate-dice-roll" style={{ animationDelay: '0.5s' }}>
          🎲
        </div>
        <div className="absolute top-80 left-20 text-casino-gold/25 text-4xl animate-dice-roll" style={{ animationDelay: '2.5s' }}>
          🎲
        </div>
        
        {/* Floating Slot Machines */}
        <div className="absolute top-40 left-1/2 text-casino-gold/20 text-6xl animate-float" style={{ animationDelay: '1.5s' }}>
          🎰
        </div>
        <div className="absolute bottom-32 right-1/4 text-casino-gold/25 text-5xl animate-float" style={{ animationDelay: '3.5s' }}>
          🎰
        </div>
        
        {/* Floating Diamonds */}
        <div className="absolute top-72 right-1/2 text-casino-gold/30 text-3xl animate-float" style={{ animationDelay: '2s' }}>
          💎
        </div>
        <div className="absolute bottom-20 left-1/3 text-casino-gold/25 text-4xl animate-float" style={{ animationDelay: '4s' }}>
          💎
        </div>
        
        {/* Additional Cards */}
        <div className="absolute bottom-40 left-10 text-casino-red/20 text-3xl animate-card-flip" style={{ animationDelay: '1.5s' }}>
          ♠
        </div>
        <div className="absolute bottom-64 right-10 text-casino-gold/20 text-4xl animate-card-flip" style={{ animationDelay: '2.5s' }}>
          ♥
        </div>
        <div className="absolute top-1/2 left-16 text-casino-gold/15 text-3xl animate-card-flip" style={{ animationDelay: '3.5s' }}>
          ♦
        </div>
        <div className="absolute top-1/3 right-16 text-casino-red/15 text-3xl animate-card-flip" style={{ animationDelay: '4.5s' }}>
          ♣
        </div>
        
        {/* Mobile specific smaller elements */}
        <div className="absolute top-16 left-1/2 text-casino-gold/20 text-2xl md:text-4xl animate-float" style={{ animationDelay: '0.8s' }}>
          🎯
        </div>
        <div className="absolute bottom-16 right-1/2 text-casino-red/20 text-2xl md:text-3xl animate-dice-roll" style={{ animationDelay: '1.8s' }}>
          🏆
        </div>
      </div>
    </>
  );
};