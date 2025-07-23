import { useState, useMemo } from "react";
import { CasinoBackground } from "@/components/CasinoBackground";
import { games } from "@/data/games";
import { ExternalLink } from "lucide-react";

const Index = () => {
  const handleGameClick = (gameUrl: string) => {
    window.open(gameUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background relative font-inter">
      <CasinoBackground />
      <div className="relative z-10">
        
        {/* Logo Section */}
        <section className="text-center py-8">
          <img 
            src="https://shawn-sweepstakes.carrd.co/assets/images/image03.png?v=0c91e9dc" 
            alt="Shawn Sweepstakes Logo" 
            className="mx-auto max-w-sm w-full h-auto"
          />
        </section>

        {/* Social Media Links */}
        <section className="flex justify-center py-4">
          <a 
            href="https://www.facebook.com/profile.php?id=61556412457080&mibextid=wwXIfr&mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-80 hover:opacity-100 transition-opacity"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">f</span>
            </div>
          </a>
        </section>

        {/* Promotional Banner */}
        <section className="text-center py-6">
          <img 
            src="https://shawn-sweepstakes.carrd.co/assets/images/image02.png?v=0c91e9dc" 
            alt="Special Promotion" 
            className="mx-auto max-w-2xl w-full h-auto rounded-lg"
          />
        </section>

        {/* Games Grid */}
        <section className="px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {games.map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleGameClick(game.gameUrl)}
                  className="group cursor-pointer transition-all duration-300 hover:scale-105"
                >
                  <div className="relative">
                    <div className="aspect-square rounded-full overflow-hidden border-2 border-casino-gold/30 group-hover:border-casino-gold transition-colors duration-300">
                      <img
                        src={game.imageUrl}
                        alt={game.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMUExQTFBIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iI0ZGRCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPkdhbWU8L3RleHQ+Cjwvc3ZnPg==';
                        }}
                      />
                    </div>
                    
                    {/* External link indicator */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-6 h-6 bg-casino-gold rounded-full flex items-center justify-center">
                        <ExternalLink className="w-3 h-3 text-black" />
                      </div>
                    </div>
                    
                    {/* Game name (if available and not "Untitled") */}
                    {game.name && game.name !== "Untitled" && (
                      <div className="text-center mt-2">
                        <p className="text-sm text-casino-gold font-medium truncate">
                          {game.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Index;