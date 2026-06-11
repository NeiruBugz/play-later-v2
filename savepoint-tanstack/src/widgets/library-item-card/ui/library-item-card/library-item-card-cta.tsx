import { Loader2, PlusCircle } from "lucide-react";
import { useState, type MouseEvent, type SyntheticEvent } from "react";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { ComposeJournalEntryDialog } from "@/features/compose-journal-entry";
import { updateLibraryItemFn } from "@/features/manage-library-entry/api/update-library-item-fn";
import { useMutationAction } from "@/shared/lib/use-mutation-action";
import { Button } from "@/shared/ui/button";

import {
  getPrimaryCtaPayload,
  type CardCtaEmphasis,
} from "./library-item-card.utility";

const EMPHASIS_VARIANT: Record<
  CardCtaEmphasis,
  "default" | "outline" | "ghost"
> = {
  primary: "default",
  outline: "outline",
  ghost: "ghost",
};

const stop = (event: SyntheticEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

export type LibraryItemCardCtaProps = {
  item: LibraryItemWithGame;
  onAddPlaythrough?: (libraryItemId: number) => void;
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
export function LibraryItemCardCta({
  item,
  onAddPlaythrough,
}: LibraryItemCardCtaProps) {
  const { pending: isPending, run } = useMutationAction();
  const [logSessionOpen, setLogSessionOpen] = useState(false);

  const {
    label,
    icon: Icon,
    emphasis,
    action,
  } = getPrimaryCtaPayload(item.status);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    stop(event);

    if (action.kind === "logSession") {
      setLogSessionOpen(true);
      return;
    }

    const startedAt =
      action.startedAtNullableSet && item.startedAt === null
        ? new Date()
        : undefined;

    await run(
      () =>
        updateLibraryItemFn({
          data: {
            itemId: item.id,
            status: action.status,
            ...(startedAt !== undefined ? { startedAt } : {}),
          },
        }),
      {
        successMessage: "Status updated",
        errorFallback: "Failed to update status",
      }
    );
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={EMPHASIS_VARIANT[emphasis]}
        className="mt-2 w-full text-xs font-semibold"
        disabled={isPending}
        onClick={handleClick}
        onMouseDown={stop}
        aria-label={label}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <>
            <Icon aria-hidden />
            {label}
          </>
        )}
      </Button>

      {onAddPlaythrough !== undefined ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="mt-1 w-full text-xs font-medium"
          onClick={(event) => {
            stop(event);
            onAddPlaythrough(item.id);
          }}
          onMouseDown={stop}
          aria-label="Add playthrough"
        >
          <PlusCircle aria-hidden />
          Add playthrough
        </Button>
      ) : null}

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
