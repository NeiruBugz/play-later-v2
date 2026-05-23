import { useRouter } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type MouseEvent, type SyntheticEvent } from "react";
import { toast } from "sonner";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { ComposeJournalEntryDialog } from "@/features/compose-journal-entry";
import { updateLibraryItemFn } from "@/features/manage-library-entry/api/update-library-item-fn";
import { Button } from "@/shared/ui/button";

import { getPrimaryCtaPayload } from "./library-item-card.utility";

const stop = (event: SyntheticEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

export type LibraryItemCardCtaProps = {
  item: LibraryItemWithGame;
};

/**
 * Card primary-CTA button — restored to parity with canonical
 * `LibraryCardCta`. Status-driven label (Queue It / Log Session / Start
 * Playing / Add to Shelf / Replay). Click is stopped so the outer card
 * `<Link>` does not navigate.
 *
 * Lives as a sibling of the card link (rendered by the parent widget),
 * not as a descendant — same structural pattern as `LibraryCardMenu` so
 * the link-bubble bug cannot resurface.
 */
export function LibraryItemCardCta({ item }: LibraryItemCardCtaProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [logSessionOpen, setLogSessionOpen] = useState(false);

  const { label, action } = getPrimaryCtaPayload(item.status);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    stop(event);

    if (action.kind === "logSession") {
      setLogSessionOpen(true);
      return;
    }

    setIsPending(true);
    try {
      const startedAt =
        action.startedAtNullableSet && item.startedAt === null
          ? new Date()
          : undefined;

      await updateLibraryItemFn({
        data: {
          itemId: item.id,
          status: action.status,
          ...(startedAt !== undefined ? { startedAt } : {}),
        },
      });
      toast.success("Status updated");
      await router.invalidate();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Failed to update status";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="mt-2 w-full text-xs font-semibold"
        disabled={isPending}
        onClick={handleClick}
        onMouseDown={stop}
        aria-label={label}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          label
        )}
      </Button>

      {action.kind === "logSession" ? (
        <ComposeJournalEntryDialog
          open={logSessionOpen}
          onOpenChange={setLogSessionOpen}
          defaultGameId={item.game.id}
        />
      ) : null}
    </>
  );
}
