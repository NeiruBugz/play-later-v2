import { NotOwnedTag, QueueMarker } from "@/entities/library-item";
import { GamePrompts } from "@/features/library-prompts/ui/game-prompts";
import { useUpNextMembership } from "@/features/up-next/model/use-up-next-membership";

import type { GameLibraryControlsProps } from "./game-library-controls.type";

export function GameLibraryControls({
  gameTitle,
  entry,
  libraryStatus,
  libraryOwnership,
  prompts,
}: GameLibraryControlsProps) {
  const membership = useUpNextMembership({
    id: entry?.id ?? 0,
    gameTitle,
    upNextPosition: entry?.upNextPosition ?? null,
  });

  if (entry === null || libraryStatus === null || libraryOwnership === null) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      data-testid="game-library-controls"
    >
      <QueueMarker
        status={libraryStatus.status}
        upNextPosition={membership.upNextPosition}
      />
      <NotOwnedTag
        status={libraryStatus.status}
        isOwned={libraryOwnership.isOwned}
      />
      {prompts !== undefined ? (
        <GamePrompts
          libraryItemId={entry.id}
          gameTitle={gameTitle}
          prompts={prompts}
          status={libraryStatus.status}
        />
      ) : null}
    </div>
  );
}
