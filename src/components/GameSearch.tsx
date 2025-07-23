import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface GameSearchProps {
  onSearchChange: (searchTerm: string) => void;
}

export const GameSearch = ({ onSearchChange }: GameSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange(value);
  };

  return (
    <div className="relative max-w-md mx-auto mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search games..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 bg-background/80 backdrop-blur-sm border-casino-gold/30 focus:border-casino-gold text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
};