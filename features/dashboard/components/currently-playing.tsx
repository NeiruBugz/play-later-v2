import { getUserGamesWithGroupedBacklog } from "@/features/dashboard/server-actions/get-user-games-with-grouped-backlog";
import { BacklogItemCard } from "@/shared/components/backlog-item-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/card";

export async function CurrentlyPlaying() {
  const { data: currentlyPlayingGames, serverError } =
    await getUserGamesWithGroupedBacklog({
      status: "PLAYING",
    });

  if (serverError) {
    return <div>{serverError}</div>;
  }

  if (!currentlyPlayingGames || currentlyPlayingGames.length === 0) {
    return <div>No currently playing games</div>;
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          Currently playing
        </CardTitle>
        <CardDescription>Description</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full max-w-[420px] justify-start gap-3 overflow-x-auto">
          {currentlyPlayingGames.map((playingItem) => {
            const { game, backlogItems } = playingItem;
            return (
              <BacklogItemCard
                key={game.id}
                hasActions={false}
                game={{
                  id: game.id,
                  title: game.title,
                  coverImage: game.coverImage,
                  igdbId: game.igdbId,
                }}
                backlogItems={backlogItems}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
