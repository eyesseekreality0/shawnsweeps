import { Crown, Sparkles } from "lucide-react";

export const Header = () => {
  return (
    <header className="relative overflow-hidden bg-gradient-royal p-6 md:p-8">
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
        <div className="flex items-center justify-center mb-4">
          <img 
            src="/lovable-uploads/fe59b40d-e5fd-4762-858c-1276be42711b.png" 
            alt="Shawn Sweepstakes Logo" 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full shadow-red-glow animate-glow object-cover"
          />
        </div>
        
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 tracking-wider">
          <span className="text-casino-gold">
            SHAWN SWEEPSTAKES
          </span>
        </h1>
      </div>
    </header>
  );
};