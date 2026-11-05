import { useRouter } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { LibraryItemWithGame } from "@/entities/library-item/api";
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
import { RatingInput } from "@/shared/ui/rating-input";

import { deleteLibraryItemFn } from "../../api/delete-library-item-fn";
import { getPlatformOptionsFn } from "../../api/get-platform-options";
import { type PlatformOptions } from "../../api/get-platform-options.constants";
import { searchPlatformsFn } from "../../api/search-platforms-fn";
import { RemoveFromLibraryDialog } from "../remove-from-library-dialog";
import { useLibraryModalForm } from "./library-modal.utility";
import { PlatformCombobox } from "./platform-combobox";

type LibraryModalProps = {
  entry: LibraryItemWithGame;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LibraryModal({ entry, open, onOpenChange }: LibraryModalProps) {
  const onClose = () => onOpenChange(false);
  const router = useRouter();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [platformOptions, setPlatformOptions] = useState<PlatformOptions>([]);

  const handleRemove = async () => {
    try {
      await deleteLibraryItemFn({ data: { itemId: entry.id } });
      toast.success("Removed from library");
      await router.invalidate();
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to remove from library"));
    }
  };

  useEffect(() => {
    let active = true;
    getPlatformOptionsFn({ data: { gameId: entry.game.id } })
      .then((opts) => {
        if (active) setPlatformOptions(opts);
      })
      .catch(() => {
        /* keep the default fallback list */
      });
    return () => {
      active = false;
    };
  }, [entry.game.id]);

  const {
    platform,
    setPlatform,
    rating,
    setRating,
    error,
    isSubmitting,
    handleSubmit,
  } = useLibraryModalForm({ entry, onClose });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry.game.title}</DialogTitle>
          <DialogDescription>Update rating and platform.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex flex-col gap-1 text-sm">
            <span id="library-modal-platform-label">Platform</span>
            <PlatformCombobox
              value={platform}
              groups={platformOptions}
              onChange={setPlatform}
              searchRemote={(q) => searchPlatformsFn({ data: { query: q } })}
            />
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span id="library-modal-rating-label">Rating</span>
            <RatingInput
              aria-label="Rating"
              readOnly={false}
              value={rating === "" ? null : Number.parseInt(rating, 10)}
              onChange={(next) => setRating(next === null ? "" : String(next))}
            />
          </div>

          {error !== null ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmingRemove(true)}
            >
              <Trash2 aria-hidden="true" />
              Remove from library
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
        <RemoveFromLibraryDialog
          open={confirmingRemove}
          onOpenChange={setConfirmingRemove}
          gameTitle={entry.game.title}
          onConfirm={() => {
            void handleRemove();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
