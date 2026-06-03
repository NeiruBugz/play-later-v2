import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getStatusLabel,
  LIBRARY_STATUS_VALUES,
} from "@/entities/library-item/model";
import { importGameToLibraryFn } from "@/features/steam-import/api/import-game-to-library";
import { calculateSmartStatus } from "@/features/steam-import/lib/calculate-smart-status";
import { formatPlaytime } from "@/features/steam-import/ui/imported-game-card/imported-game-card.utility";
import { formatAbsoluteDate } from "@/shared/lib/date";
import { getErrorMessage } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";
import { IgdbManualSearch } from "../igdb-manual-search";
import type { ImportGameModalProps } from "./import-game-modal.type";

const STATUS_OPTIONS = LIBRARY_STATUS_VALUES;

function formatLastPlayed(date: Date | null | undefined): string {
  if (!date) return "Never";
  return formatAbsoluteDate(new Date(date), { locale: undefined });
}

/**
 * Combined "match + add to library" modal.
 *
 * Two views:
 *   1. **Status picker** (default). User confirms library status with a
 *      smart default derived from playtime. Submitting calls
 *      `importGameToLibraryFn` without `manualIgdbId` — the worker either
 *      succeeds (if a future auto-matcher resolves the row) or throws
 *      `NeedsManualMatchError`, which switches the modal to view 2.
 *   2. **Manual search** (fallback). `IgdbManualSearch` picker; on
 *      `onSelect(igdbId)`, calls `importGameToLibraryFn` with
 *      `manualIgdbId` set.
 */
export function ImportGameModal({
  isOpen,
  onClose,
  game,
  startOnSearch = false,
  onImported,
}: ImportGameModalProps) {
  const smartStatus = calculateSmartStatus({
    playtime: game.playtime,
    lastPlayedAt: game.lastPlayedAt,
  });
  const [status, setStatus] = useState<LibraryItemStatus>(smartStatus);
  const [showSearch, setShowSearch] = useState(startOnSearch);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowSearch(startOnSearch);
      setStatus(smartStatus);
    }
  }, [isOpen, startOnSearch, smartStatus]);

  const runImport = async (manualIgdbId?: number) => {
    setIsPending(true);
    try {
      await importGameToLibraryFn({
        data: {
          importedGameId: game.id,
          status,
          ...(manualIgdbId !== undefined && { manualIgdbId }),
        },
      });
      toast.success("Added to library");
      onImported?.();
      onClose();
    } catch (err) {
      const errorName =
        err && typeof err === "object" && "name" in err
          ? String((err as { name: unknown }).name)
          : "";
      const message = getErrorMessage(err, "Could not import game");
      if (errorName === "NeedsManualMatchError") {
        setShowSearch(true);
        return;
      }
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {showSearch ? "Select correct game" : "Import to library"}
          </DialogTitle>
          <DialogDescription className="truncate">
            {game.name}
          </DialogDescription>
        </DialogHeader>

        {showSearch ? (
          <div className="space-y-4 overflow-hidden py-2">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                We couldn&apos;t auto-match this Steam game. Search IGDB and
                pick the correct entry.
              </p>
            </div>
            <IgdbManualSearch
              onSelect={(igdbId) => void runImport(igdbId)}
              isLoading={isPending}
            />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Playtime</span>
                <span className="font-medium">
                  {formatPlaytime(game.playtime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last played</span>
                <span className="font-medium">
                  {formatLastPlayed(game.lastPlayedAt)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="import-status-select"
                className="text-sm font-medium"
              >
                Library status
              </label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as LibraryItemStatus)}
              >
                <SelectTrigger id="import-status-select">
                  <SelectValue>{getStatusLabel(status)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {getStatusLabel(opt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Smart default: {getStatusLabel(smartStatus)}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {showSearch ? (
            <Button
              variant="secondary"
              onClick={() => setShowSearch(false)}
              disabled={isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              Back
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={() => void runImport()} disabled={isPending}>
                {isPending ? "Importing…" : "Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
