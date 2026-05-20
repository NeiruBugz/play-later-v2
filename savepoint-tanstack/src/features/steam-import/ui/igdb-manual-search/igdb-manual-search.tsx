import { useState } from "react";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

export type IgdbManualSearchProps = {
  isOpen: boolean;
  onClose: () => void;
  /** The unmatched imported-game row whose IGDB link the user is choosing. */
  importedGameId: string;
  initialQuery?: string;
};

/**
 * IGDB manual-search popover for unmatched imported games (Slice 21 Phase D).
 *
 * **Stub implementation.** Phase C did not ship an entity-layer
 * `linkImportedGameToIgdb.server.ts` write, and `searchGamesFn` exists in
 * Slice 8/17 but wiring full search results + link-to-igdb is out of scope
 * for Phase D. The dialog renders the input, accepts a query, and on
 * "Select" fires `console.warn` + closes. Documented in DIVERGENCES.md as a
 * known gap — to be completed in a follow-up slice.
 */
export function IgdbManualSearch({
  isOpen,
  onClose,
  importedGameId,
  initialQuery = "",
}: IgdbManualSearchProps) {
  const [query, setQuery] = useState(initialQuery);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Search IGDB</DialogTitle>
          <DialogDescription>
            Find the right IGDB entry for this Steam game. Selecting a match
            links the row so it can be added to your library.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Search IGDB…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="IGDB search query"
          />
          <p className="text-muted-foreground text-sm">
            (Linking is not yet implemented in this build. See DIVERGENCES.md.)
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                console.warn(
                  `[igdb-manual-search] link-to-igdb not implemented; importedGameId=${importedGameId} query=${query}`
                );
                onClose();
              }}
            >
              Select
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
