import { AddReviewDialog } from "@/features/add-review/components";
import {
  EditGameEntryModal,
  GameStatusSelector,
} from "@/features/manage-backlog-item/edit-backlog-item";
import { BacklogItem } from "@prisma/client";

type GameQuickActionsProps = {
  gameId: string;
  gameTitle: string;
  backlogItems?: BacklogItem[];
  gameType: "EXTERNAL" | "INTERNAL";
};

export function GameQuickActions({
  gameId,
  gameTitle,
  backlogItems,
  gameType,
}: GameQuickActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {gameType === "EXTERNAL" ? <GameStatusSelector gameId={gameId} /> : null}

      <EditGameEntryModal backlogItems={backlogItems} />

      <AddReviewDialog gameId={gameId} gameTitle={gameTitle} />
    </div>
  );
}
