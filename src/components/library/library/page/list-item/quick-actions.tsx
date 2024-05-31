import type { Game } from "@prisma/client";
import { DeleteAction } from "@/src/components/library/library/page/list-item/delete-action";
import { updateStatus } from "@/src/entities/game/update-game";
import { cn } from "@/src/shared/lib/tailwind-merge";
import { Button } from "@/src/shared/ui/button";

export const QuickActions = ({
  currentStatus,
  id,
}: {
  currentStatus: string;
  id: Game["id"];
}) => {
  if (currentStatus === "COMPLETED") {
    return (
      <div className={cn("hidden flex-wrap gap-2 self-center md:flex")}>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "FULL_COMPLETION");
          }}
        >
          <Button type="submit">Mastered</Button>
        </form>

        <DeleteAction id={id} />
      </div>
    );
  }

  if (
    currentStatus === "ABANDONED" ||
    currentStatus === "SHELVED" ||
    currentStatus === "BACKLOG"
  ) {
    return (
      <div className={cn("hidden flex-wrap gap-2 self-center md:flex")}>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "INPROGRESS");
          }}
        >
          <Button type="submit">Start playing</Button>
        </form>

        <DeleteAction id={id} />
      </div>
    );
  }

  if (currentStatus === "INPROGRESS") {
    return (
      <div className={cn("hidden flex-wrap gap-2 self-center md:flex")}>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "COMPLETED");
          }}
        >
          <Button type="submit">Finished</Button>
        </form>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "FULL_COMPLETION");
          }}
        >
          <Button type="submit">Mastered</Button>
        </form>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "ABANDONED");
          }}
        >
          <Button type="submit">Abandon</Button>
        </form>
        <form
          action={async () => {
            "use server";
            await updateStatus(id, "SHELVED");
          }}
        >
          <Button type="submit">Return later</Button>
        </form>

        <DeleteAction id={id} />
      </div>
    );
  }
};
