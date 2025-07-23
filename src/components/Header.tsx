import { Crown, Sparkles } from "lucide-react";

export const Header = () => {
  return (
    <header className="relative overflow-hidden bg-gradient-royal p-8 md:p-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-4 left-4 animate-float">
          <Sparkles className="w-8 h-8 text-casino-gold" />
        </div>
        <div className="absolute top-8 right-8 animate-float" style={{ animationDelay: '1s' }}>
          <Crown className="w-6 h-6 text-casino-gold" />
        </div>
        <div className="absolute bottom-6 left-1/4 animate-float" style={{ animationDelay: '2s' }}>
          <Sparkles className="w-6 h-6 text-casino-gold" />
        </div>
        <div className="absolute bottom-4 right-1/3 animate-float" style={{ animationDelay: '0.5s' }}>
          <Crown className="w-8 h-8 text-casino-gold" />
        </div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <img 
            src="/lovable-uploads/fe59b40d-e5fd-4762-858c-1276be42711b.png" 
            alt="Shawn Sweepstakes Logo" 
            className="w-32 h-32 md:w-40 md:h-40 rounded-full shadow-pink-glow animate-glow object-cover"
          />
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 tracking-wider">
          <span className="bg-gradient-to-r from-casino-gold via-casino-pink to-casino-gold bg-clip-text text-transparent">
            SHAWN
          </span>
          <br />
          <span className="bg-gradient-to-r from-casino-pink via-casino-gold to-casino-pink bg-clip-text text-transparent">
            SWEEPSTAKES
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
          Welcome to the ultimate destination for premium sweepstakes gaming. 
          Discover the finest selection of games and experience the thrill of winning.
        </p>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-casino-pink">
          <Crown className="w-5 h-5" />
          <span className="text-sm font-medium tracking-widest uppercase">
            Royal Gaming Experience
          </span>
          <Crown className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
};