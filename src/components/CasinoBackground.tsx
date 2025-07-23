export const CasinoBackground = () => {
  return (
    <>
      {/* Casino Video Background */}
      <div className="video-background">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover"
        >
          {/* Epic casino space background video */}
          <source src="https://cdn.pixabay.com/video/2023/07/15/170798-846894298_large.mp4" type="video/mp4" />
          
          {/* Fallback for browsers that don't support video */}
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"></div>
        </video>
      </div>
      
      {/* Dark overlay for better text readability */}
      <div className="video-overlay"></div>
      
      {/* Floating casino elements for extra atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-10 left-10 text-casino-gold/20 text-3xl animate-float" style={{ animationDelay: '0s' }}>
          ♠
        </div>
        <div className="absolute top-32 right-20 text-casino-red/20 text-3xl animate-float" style={{ animationDelay: '2s' }}>
          ♥
        </div>
        <div className="absolute bottom-32 left-20 text-casino-gold/20 text-3xl animate-float" style={{ animationDelay: '4s' }}>
          ♦
        </div>
        <div className="absolute bottom-20 right-32 text-casino-red/20 text-3xl animate-float" style={{ animationDelay: '6s' }}>
          ♣
        </div>
        <div className="absolute top-1/2 left-20 text-casino-gold/15 text-4xl animate-float" style={{ animationDelay: '1s' }}>
          🎰
        </div>
        <div className="absolute top-1/3 right-20 text-casino-gold/15 text-3xl animate-float" style={{ animationDelay: '3s' }}>
          🎲
        </div>
      </div>
    </>
  );
};