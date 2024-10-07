import { getUserGamesWithGroupedBacklog } from "@/src/entities/backlog-item";
import { getIgnoredGames } from "@/src/entities/ignored-game";
import { ImportDialog } from "@/src/features/steam-import";
import { Header } from "@/src/widgets/header";

export default async function SteamImportPage() {
  const collectionPromise = getUserGamesWithGroupedBacklog({
    platform: "",
    status: "",
  });
  const ignoredPromise = getIgnoredGames();
  const [collection, ignoredGames] = await Promise.all([
    collectionPromise,
    ignoredPromise,
  ]);

  return (
    <>
      <Header />
      <div className="container mx-auto">
        <h2 className="my-2 font-bold md:text-xl xl:text-2xl">Games import</h2>
        <ImportDialog
          existingGames={collection}
          ignoredGames={ignoredGames ?? []}
        />
      </div>
    </>
  );
}
