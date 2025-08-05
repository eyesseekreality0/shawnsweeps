export const CasinoBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Casino slot machine background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/lovable-uploads/0a72a758-c5cd-4fee-a196-97a26fc87cde.png')"
        }}
      />
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Gradient overlay for enhanced visual depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
      
      {/* Floating casino elements with reduced opacity to not compete with background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Card suits with golden colors */}
        <div className="absolute top-10 left-10 text-yellow-400/30 text-2xl md:text-3xl animate-float" style={{ animationDelay: '0s' }}>
          ♠
        </div>
        <div className="absolute top-32 right-20 text-red-400/30 text-2xl md:text-3xl animate-float" style={{ animationDelay: '2s' }}>
          ♥
        </div>
        <div className="absolute bottom-32 left-20 text-yellow-400/30 text-2xl md:text-3xl animate-float" style={{ animationDelay: '4s' }}>
          ♦
        </div>
        <div className="absolute bottom-20 right-32 text-red-400/30 text-2xl md:text-3xl animate-float" style={{ animationDelay: '6s' }}>
          ♣
        </div>
        
        {/* Additional floating elements for richness */}
        <div className="absolute top-1/4 right-1/4 text-yellow-300/20 text-lg md:text-xl animate-float" style={{ animationDelay: '7s' }}>
          ⭐
        </div>
        <div className="absolute bottom-1/4 left-1/4 text-red-300/20 text-lg md:text-xl animate-float" style={{ animationDelay: '8s' }}>
          💎
        </div>
        <div className="absolute top-3/4 right-1/3 text-amber-300/20 text-lg md:text-xl animate-float" style={{ animationDelay: '9s' }}>
          🏆
        </div>
      </div>
    </div>
  );
};