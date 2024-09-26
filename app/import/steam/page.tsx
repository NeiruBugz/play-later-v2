import { getUserGamesWithGroupedBacklog } from "@/src/entities/backlog-item";
import { ImportDialog } from "@/src/features/steam-import";
import { Header } from "@/src/widgets/header";

export default async function SteamImportPage() {
  const collection = await getUserGamesWithGroupedBacklog({
    platform: "",
    status: "",
  });

  return (
    <>
      <Header />
      <div className="container mx-auto">
        <h2 className="my-2 font-bold md:text-xl xl:text-2xl">Games import</h2>
        <ImportDialog existingGames={collection} />
      </div>
    </>
  );
}
