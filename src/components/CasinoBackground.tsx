export const CasinoBackground = () => {
  return (
    <>
      {/* Floating Casino Elements - Minimal */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle floating elements to complement the roulette */}
        <div className="absolute top-10 left-10 text-casino-gold/10 text-2xl animate-float" style={{ animationDelay: '0s' }}>
          ♠
        </div>
        <div className="absolute top-32 right-20 text-casino-red/10 text-2xl animate-float" style={{ animationDelay: '2s' }}>
          ♥
        </div>
        <div className="absolute bottom-32 left-20 text-casino-gold/10 text-2xl animate-float" style={{ animationDelay: '4s' }}>
          ♦
        </div>
        <div className="absolute bottom-20 right-32 text-casino-red/10 text-2xl animate-float" style={{ animationDelay: '6s' }}>
          ♣
        </div>
      </div>
    </>
  );
};