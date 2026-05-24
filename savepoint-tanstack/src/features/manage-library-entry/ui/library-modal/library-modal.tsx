import { Trash2 } from "lucide-react";
import { useState } from "react";

import type { LibraryItemWithGame } from "@/entities/library-item/api";
import { LIBRARY_STATUS_LABELS } from "@/entities/library-item/model";
import { Button } from "@/shared/ui/button";
import { DatePicker } from "@/shared/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { RatingInput } from "@/shared/ui/rating-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { DeleteConfirm } from "./delete-confirm";
import {
  PLATFORM_OPTIONS,
  STATUS_VALUES,
  useLibraryModalForm,
} from "./library-modal.utility";

type LibraryModalProps = {
  entry: LibraryItemWithGame;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LibraryModal({ entry, open, onOpenChange }: LibraryModalProps) {
  const onClose = () => onOpenChange(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    status,
    setStatus,
    platform,
    setPlatform,
    rating,
    setRating,
    startedAt,
    setStartedAt,
    completedAt,
    setCompletedAt,
    error,
    isSubmitting,
    handleSubmit,
  } = useLibraryModalForm({ entry, onClose });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry.game.title}</DialogTitle>
          <DialogDescription>
            Update status, rating, platform, and play dates.
          </DialogDescription>
        </DialogHeader>

        {confirmingDelete ? (
          <DeleteConfirm
            itemId={entry.id}
            gameTitle={entry.game.title}
            onCancel={() => setConfirmingDelete(false)}
            onDeleted={onClose}
          />
        ) : (
          <form onSubmit={handleSubmit} className="gap-md flex flex-col">
            <div className="gap-xs flex flex-col text-sm">
              <span id="library-modal-status-label">Status</span>
              <Select
                value={status}
                onValueChange={(next) => setStatus(next as typeof status)}
              >
                <SelectTrigger
                  aria-label="Status"
                  aria-labelledby="library-modal-status-label"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {LIBRARY_STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="gap-xs flex flex-col text-sm">
              <span id="library-modal-platform-label">Platform</span>
              <Select
                value={platform === "" ? "__none__" : platform}
                onValueChange={(next) =>
                  setPlatform(next === "__none__" ? "" : next)
                }
              >
                <SelectTrigger
                  aria-label="Platform"
                  aria-labelledby="library-modal-platform-label"
                >
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No platform</SelectItem>
                  {PLATFORM_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                  {platform !== "" && !PLATFORM_OPTIONS.includes(platform) ? (
                    <SelectItem value={platform}>{platform}</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div className="gap-xs flex flex-col text-sm">
              <span id="library-modal-rating-label">Rating</span>
              <RatingInput
                aria-label="Rating"
                readOnly={false}
                value={rating === "" ? null : Number.parseInt(rating, 10)}
                onChange={(next) =>
                  setRating(next === null ? "" : String(next))
                }
              />
            </div>

            <div className="gap-xs flex flex-col text-sm">
              <span id="library-modal-started-label">Started</span>
              <DatePicker
                ariaLabel="Started"
                value={startedAt}
                onChange={setStartedAt}
              />
            </div>

            <div className="gap-xs flex flex-col text-sm">
              <span id="library-modal-completed-label">Completed</span>
              <DatePicker
                ariaLabel="Completed"
                value={completedAt}
                onChange={setCompletedAt}
              />
              {completedAt === null ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setCompletedAt(new Date())}
                >
                  Mark complete
                </Button>
              ) : null}
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
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 aria-hidden="true" />
                Delete from library
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
