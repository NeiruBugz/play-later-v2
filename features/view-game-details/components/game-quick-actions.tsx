import { type LibraryItem } from "@prisma/client";

import { AddReviewDialog } from "@/features/add-review/components";
import {
  EditGameEntryModal,
  GameStatusSelector,
} from "@/features/manage-library-item/edit-library-item";

type GameQuickActionsProps = {
  gameId: string;
  gameTitle: string;
  libraryItems?: LibraryItem[];
  gameType: "EXTERNAL" | "INTERNAL";
};

export function GameQuickActions({
  gameId,
  gameTitle,
  libraryItems,
  gameType,
}: GameQuickActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {gameType === "EXTERNAL" ? <GameStatusSelector gameId={gameId} /> : null}

      <EditGameEntryModal libraryItems={libraryItems} />

      <AddReviewDialog gameId={gameId} gameTitle={gameTitle} />
    </div>
  );
}
