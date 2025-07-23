import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { GameCard } from "@/components/GameCard";
import { games } from "@/data/games";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid3X3, List, Star } from "lucide-react";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredGames = useMemo(() => {
    return games.filter(game =>
      game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const featuredGames = games.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Search and Controls */}
      <section className="px-4 py-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card border-border focus:border-casino-gold"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-md overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "casino" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "casino" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Games Section */}
        {!searchTerm && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-casino-gold" />
              <h2 className="text-2xl font-bold text-foreground">Featured Games</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredGames.map((game) => (
                <div
                  key={game.id}
                  className="transition-all duration-300"
                >
                  <GameCard
                    name={game.name}
                    imageUrl={game.imageUrl}
                    gameUrl={game.gameUrl}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Games Section */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {searchTerm ? `Search Results (${filteredGames.length})` : "All Games"}
          </h2>
          
          {filteredGames.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No games found matching your search.</p>
              <Button
                variant="casino"
                onClick={() => setSearchTerm("")}
                className="mt-4"
              >
                Show All Games
              </Button>
            </div>
          ) : (
            <div className={`
              ${viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-3 gap-6" 
                : "space-y-4"
              }
            `}>
              {filteredGames.map((game) => (
                <div
                  key={game.id}
                  className={`transition-all duration-300 ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  <GameCard
                    name={game.name}
                    imageUrl={game.imageUrl}
                    gameUrl={game.gameUrl}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-casino-darker border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 Shawn Sweepstakes. All rights reserved. Play responsibly.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Must be 18+ to play. Sweepstakes games are for entertainment purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
