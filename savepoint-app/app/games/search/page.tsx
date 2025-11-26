import type { Metadata } from "next";

import { GameSearchInput } from "@/features/game-search/ui/game-search-input";

export const dynamic = "force-dynamic";

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
    <div className="px-2xl container mx-auto">
      <div className="space-y-3xl">
        <div className="space-y-lg">
          <h1 className="heading-xl">Search Games</h1>
          <p className="body-md text-muted-foreground">
            Find games to add to your SavePoint library
          </p>
        </div>
        <GameSearchInput initialQuery={initialQuery} />
      </div>
    </div>
  );
}
