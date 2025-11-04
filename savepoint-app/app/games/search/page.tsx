import type { Metadata } from "next";

import { GameSearchInput } from "@/features/game-search/ui/game-search-input";

export const metadata: Metadata = {
  title: "Search Games | SavePoint",
  description: "Search our extensive game database powered by IGDB",
};

export default function GameSearchPage() {
  return (
    <div className="container mx-auto px-6 py-10">
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Search Games</h1>
          <p className="text-muted-foreground text-base">
            Find games to add to your SavePoint library
          </p>
        </div>

        <GameSearchInput />
      </div>
    </div>
  );
}
