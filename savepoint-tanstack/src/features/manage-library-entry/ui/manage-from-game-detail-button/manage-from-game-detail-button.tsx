import { useState } from "react";

import type { LibraryItemWithGame } from "@/entities/library-item/model";
import { Button } from "@/shared/ui/button";

import { LibraryModal } from "../library-modal";

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
