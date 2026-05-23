import type { LibraryItemWithGame } from "@/entities/library-item/api";
import { LIBRARY_STATUS_LABELS } from "@/entities/library-item/model";
import { cn } from "@/shared/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { DeleteSection } from "./delete-section";
import {
  inputClasses,
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
              onChange={(next) => setRating(next === null ? "" : String(next))}
            />
          </div>

          <label className="gap-xs flex flex-col text-sm">
            <span>Started</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              pattern="\d{4}-\d{2}-\d{2}"
              aria-label="Started"
              className={cn(inputClasses)}
              value={startedAt}
              onChange={(event) => setStartedAt(event.target.value)}
            />
          </label>

          <label className="gap-xs flex flex-col text-sm">
            <span>Completed</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="YYYY-MM-DD"
              pattern="\d{4}-\d{2}-\d{2}"
              aria-label="Completed"
              className={cn(inputClasses)}
              value={completedAt}
              onChange={(event) => setCompletedAt(event.target.value)}
            />
          </label>

          {error !== null ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              Save changes
            </Button>
          </DialogFooter>
        </form>

        <DeleteSection itemId={entry.id} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
