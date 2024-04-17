import { Game } from "@prisma/client";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { DeleteAction } from "@/app/(protected)/library/components/library/page/list-item/delete-action";
import { updateStatus } from "@/app/(protected)/library/lib/actions/update-game";

export const QuickActions = ({
  currentStatus,
  id,
}: {
  currentStatus: string;
  id: Game["id"];
}) => {
  if (currentStatus === "BACKLOG") {
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

  if (currentStatus === "ABANDONED" || currentStatus === "SHELVED") {
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
          <Button type="submit">Mark completed</Button>
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
