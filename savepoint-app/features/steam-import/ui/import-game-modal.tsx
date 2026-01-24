"use client";

import type { ImportedGame } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { getStatusConfig } from "@/shared/lib/library-status";
import { LibraryItemStatus } from "@/shared/types";

import { useImportGame } from "../hooks/use-import-game";
import { calculateSmartStatus } from "../lib/calculate-smart-status";
import { formatLastPlayed, formatPlaytime } from "../lib/formatters";
import type { LibraryStatus } from "../types";
import { IgdbManualSearch } from "./igdb-manual-search";

type ImportGameModalProps = {
  isOpen: boolean;
  onClose: () => void;
  game: ImportedGame;
};

const STATUS_OPTIONS = [
  {
    value: LibraryItemStatus.WANT_TO_PLAY,
    label: "Want to Play",
  },
  {
    value: LibraryItemStatus.OWNED,
    label: "Owned",
  },
  {
    value: LibraryItemStatus.PLAYING,
    label: "Playing",
  },
  {
    value: LibraryItemStatus.PLAYED,
    label: "Played",
  },
];

export function ImportGameModal({
  isOpen,
  onClose,
  game,
}: ImportGameModalProps) {
  const smartStatus = calculateSmartStatus(game);
  const [selectedStatus, setSelectedStatus] =
    useState<LibraryItemStatus>(smartStatus);
  const [showManualSearch, setShowManualSearch] = useState(false);

  const importGame = useImportGame();

  const handleImport = async () => {
    const importStatus = selectedStatus.toLowerCase() as LibraryStatus;

    importGame.mutate(
      {
        importedGameId: game.id,
        status: importStatus,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          if (errorMessage.includes("No IGDB match found")) {
            setShowManualSearch(true);
          }
        },
      }
    );
  };

  const handleManualSelect = (igdbId: number) => {
    const importStatus = selectedStatus.toLowerCase() as LibraryStatus;

    importGame.mutate(
      {
        importedGameId: game.id,
        status: importStatus,
        manualIgdbId: igdbId,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleBack = () => {
    setShowManualSearch(false);
  };

  const statusConfig = getStatusConfig(selectedStatus);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {showManualSearch
              ? "Select Correct Game"
              : "Import Game to Library"}
          </DialogTitle>
          <DialogDescription className="truncate">
            {game.name}
          </DialogDescription>
        </DialogHeader>

        {showManualSearch ? (
          <div className="space-y-4 overflow-hidden py-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">
                We couldn't automatically match this Steam game to our database.
                Please search and select the correct game manually.
              </p>
            </div>

            <IgdbManualSearch
              onSelect={handleManualSelect}
              isLoading={importGame.isPending}
            />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Playtime:</span>
                <span className="font-medium">
                  {formatPlaytime(game.playtime)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Played:</span>
                <span className="font-medium">
                  {formatLastPlayed(game.lastPlayedAt)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="status-select" className="text-sm font-medium">
                Library Status
              </label>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as LibraryItemStatus)
                }
              >
                <SelectTrigger id="status-select">
                  <SelectValue>
                    {
                      STATUS_OPTIONS.find(
                        (option) => option.value === selectedStatus
                      )?.label
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Smart default: {statusConfig.label}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {showManualSearch ? (
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={importGame.isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={importGame.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                loading={importGame.isPending}
                disabled={importGame.isPending}
              >
                Import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
