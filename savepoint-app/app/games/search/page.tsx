import type { Metadata } from "next";
import { GameSearchInput } from "@/features/game-search/ui/game-search-input";
export const metadata: Metadata = {
  title: "Search Games | SavePoint",
  description: "Search our extensive game database powered by IGDB",
};
type GameSearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};
export default async function GameSearchPage({
  searchParams,
}: GameSearchPageProps) {
  const { q } = await searchParams;
  const initialQuery = q || "";
  return (
    <div className="container mx-auto px-6">
      <div className="space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Search Games</h1>
          <p className="text-muted-foreground text-base">
            Find games to add to your SavePoint library
          </p>
        </div>
        <GameSearchInput initialQuery={initialQuery} />
      </div>
    </div>
  );
}
