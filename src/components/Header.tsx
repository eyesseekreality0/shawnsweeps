import { Crown, Sparkles } from "lucide-react";
import logoImage from "@/assets/shawn-logo.jpg";

export const Header = () => {
  return (
    <header className="relative overflow-hidden bg-gradient-primary p-8 md:p-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
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
            src={logoImage} 
            alt="Shawn Sweepstakes Logo" 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full shadow-red-glow animate-glow"
          />
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 tracking-wider">
          <span className="bg-gradient-gold bg-clip-text text-transparent">
            SHAWN
          </span>
          <br />
          <span className="text-foreground">
            SWEEPSTAKES
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
          Welcome to the ultimate destination for premium sweepstakes gaming. 
          Discover the finest selection of games and experience the thrill of winning.
        </p>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-casino-gold">
          <Crown className="w-5 h-5" />
          <span className="text-sm font-medium tracking-widest uppercase">
            Premium Gaming Experience
          </span>
          <Crown className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
};