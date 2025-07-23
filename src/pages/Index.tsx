import { useState, useMemo } from "react";
import { CasinoBackground } from "@/components/CasinoBackground";
import { DepositForm } from "@/components/DepositForm";
import { GameSearch } from "@/components/GameSearch";
import { games } from "@/data/games";
import { ExternalLink } from "lucide-react";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGames = useMemo(() => {
    if (!searchTerm) return games;
    return games.filter(game => 
      game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleGameClick = (gameUrl: string) => {
    window.open(gameUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen relative font-inter overflow-x-hidden">
      <CasinoBackground />
      <div className="relative z-10">
        
        {/* Logo Section */}
        <section className="text-center py-3 px-4">
          <img 
            src="https://shawn-sweepstakes.carrd.co/assets/images/image03.png?v=0c91e9dc" 
            alt="Shawn Sweepstakes Logo" 
            className="mx-auto max-w-xs sm:max-w-sm w-full h-auto"
          />
        </section>

        {/* Social Media Links */}
        <section className="flex justify-center py-2 px-4">
          <a 
            href="https://www.facebook.com/profile.php?id=61556412457080&mibextid=wwXIfr&mibextid=wwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-80 hover:opacity-100 transition-opacity"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
              <span className="text-white font-bold text-base sm:text-lg">f</span>
            </div>
          </a>
        </section>

        {/* Deposit Button */}
        <section className="text-center py-3 px-4">
          <DepositForm />
        </section>

        {/* Promotional Banner */}
        <section className="text-center py-3 px-4">
          <img 
            src="https://shawn-sweepstakes.carrd.co/assets/images/image02.png?v=0c91e9dc" 
            alt="Special Promotion" 
            className="mx-auto max-w-xl lg:max-w-2xl w-full h-auto rounded-lg shadow-lg"
          />
        </section>

        {/* Search Bar */}
        <section className="px-4 py-1">
          <GameSearch onSearchChange={setSearchTerm} />
        </section>

        {/* Games Grid */}
        <section className="px-4 py-1 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleGameClick(game.gameUrl)}
                  className="group cursor-pointer transition-all duration-300 hover:scale-105 tap-highlight-transparent"
                >
                  <div className="relative touch-manipulation">
                    <div className="aspect-square rounded-full overflow-hidden border-2 border-casino-gold/30 group-hover:border-casino-gold transition-colors duration-300 shadow-lg group-hover:shadow-xl">
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
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-casino-gold rounded-full flex items-center justify-center shadow-lg">
                        <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />
                      </div>
                    </div>
                    
                    {/* Game name (if available and not "Untitled") */}
                    {game.name && game.name !== "Untitled" && (
                      <div className="text-center mt-2">
                        <p className="text-xs sm:text-sm text-casino-gold font-medium truncate px-1">
                          {game.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {filteredGames.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No games found matching your search.</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Index;