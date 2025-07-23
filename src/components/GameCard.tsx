import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface GameCardProps {
  name: string;
  imageUrl: string;
  gameUrl: string;
}

export const GameCard = ({ name, imageUrl, gameUrl }: GameCardProps) => {
  const handleClick = () => {
    window.open(gameUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card 
      onClick={handleClick}
      className="group relative overflow-hidden bg-gradient-card border-border hover:border-casino-gold cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-red-glow hover:animate-glow rounded-full"
    >
      <div className="aspect-square relative rounded-full overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 rounded-full"
          onError={(e) => {
            // Fallback to a placeholder if image fails to load
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMUExQTFBIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iI0ZGRCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPkdhbWU8L3RleHQ+Cjwvc3ZnPg==';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-casino-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ExternalLink className="w-5 h-5 text-casino-gold" />
        </div>
      </div>
      
      {name && name !== "Untitled" && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-casino-dark to-transparent">
          <h3 className="text-sm font-semibold text-casino-gold truncate">
            {name}
          </h3>
        </div>
      )}
    </Card>
  );
};