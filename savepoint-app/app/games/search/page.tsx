import { auth } from "@/auth";
import type { Metadata } from "next";

import { GameSearchInput } from "@/features/game-search";

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
  const session = await auth();
  const userId = session?.user?.id;

  return (
    <div className="px-2xl py-2xl container mx-auto">
      <div className="space-y-xl">
        <div className="space-y-sm">
          <h1 className="heading-lg">Search Games</h1>
          <p className="text-muted-foreground text-sm">
            Find games to add to your SavePoint library
          </p>
        </div>
        <GameSearchInput initialQuery={initialQuery} userId={userId} />
      </div>
    </div>
  );
}
