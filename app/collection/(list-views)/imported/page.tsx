import { ImportedGames } from "@/features/view-imported-games";

export const dynamic = "force-dynamic";

export default function ImportedGamesPage() {
  return (
    <div className="container overflow-hidden px-4 py-8 pt-16">
      <ImportedGames limit={24} />
    </div>
  );
}
