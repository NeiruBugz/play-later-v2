import { useState } from "react";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { Button } from "@/shared/ui/button";

import { LibraryModal } from "../library-modal";

// FSD note: feature/ui component composing the LibraryModal sibling. Trigger
// owns its own modal-open boolean and conditionally mounts the modal —
// mirrors the slice 11 host-owned-state pattern from <LibraryPage/>.
// Slice 13 / Task 6 — manage CTA on the game-detail page.

type ManageFromGameDetailButtonProps = {
  entry: LibraryItemWithGame;
};

export function ManageFromGameDetailButton({
  entry,
}: ManageFromGameDetailButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label={`Manage ${entry.game.title} in library`}
      >
        Manage in library
      </Button>
      {open ? (
        <LibraryModal entry={entry} open={open} onOpenChange={setOpen} />
      ) : null}
    </>
  );
}
