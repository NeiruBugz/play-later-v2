import { getUserGamesWithGroupedBacklog } from "@/slices/backlog/api";
import { ImportDialog } from "@/slices/import/steam";
import { getUserInfo } from "@/slices/user/api/get-user-info";
import { getIgnoredGames } from "@/src/entities/ignored-game";
import igdbApi from "@/src/shared/api/igdb";
import { Header } from "@/src/widgets/header";

export default async function SteamImportPage() {
  const platformId = await igdbApi.getPlatformId("PC (Microsoft Windows)");
  const collectionPromise = getUserGamesWithGroupedBacklog({
    platform: "",
    status: "",
  });
  const ignoredPromise = getIgnoredGames();
  const userInfo = getUserInfo();
  const [collection, ignoredGames, userData] = await Promise.all([
    collectionPromise,
    ignoredPromise,
    userInfo,
  ]);

  return (
    <>
      <Header />
      <div className="container mx-auto mt-[60px] space-y-8 py-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Import Steam Games
          </h1>
          <p className="text-muted-foreground">
            Enter your Steam profile custom name or ID
          </p>
        </div>
        <ImportDialog
          existingGames={collection}
          ignoredGames={ignoredGames ?? []}
          userData={userData}
          platformId={platformId?.platformId?.[0]?.id || 0}
        />
      </div>
    </>
  );
}
