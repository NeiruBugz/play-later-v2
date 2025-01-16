import { BacklogItemCard } from "@/slices/shared/widgets/backlog-item-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/ui/card";
import { getUserGamesWithGroupedBacklog } from "slices/backlog/api";

export async function CurrentlyPlaying() {
  const currentlyPlayingGames = await getUserGamesWithGroupedBacklog({
    status: "PLAYING",
  });

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
