import { useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import type { LibraryItemWithGame } from "@/entities/library-item/api";
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

import { deleteLibraryItemFn } from "../../api/delete-library-item-fn";
import { updateLibraryItemFn } from "../../api/update-library-item-fn";

// FSD note: this is a feature/ui component that calls feature/api server fns
// directly (no useServerFn) — mirrors the AddGameModal precedent.

const STATUS_OPTIONS: ReadonlyArray<{
  value: "WISHLIST" | "SHELF" | "UP_NEXT" | "PLAYING" | "PLAYED";
  label: string;
}> = [
  { value: "WISHLIST", label: "Wishlist" },
  { value: "SHELF", label: "Shelf" },
  { value: "UP_NEXT", label: "Up Next" },
  { value: "PLAYING", label: "Playing" },
  { value: "PLAYED", label: "Played" },
];

const PLATFORM_OPTIONS: ReadonlyArray<string> = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X|S",
  "Xbox One",
  "Nintendo Switch",
];

const selectClasses =
  "h-10 rounded-lg border border-border bg-card px-md text-sm text-foreground shadow-paper-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const inputClasses =
  "h-10 rounded-lg border border-border bg-card px-md text-sm text-foreground shadow-paper-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type LibraryModalProps = {
  entry: LibraryItemWithGame;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];

function dateToInputValue(date: Date | null): string {
  if (date === null) return "";
  // Render YYYY-MM-DD for <input type="date">.
  const iso = date.toISOString();
  return iso.slice(0, 10);
}

function inputValueToDate(raw: string): Date | null {
  if (raw === "") return null;
  return new Date(raw);
}

export function LibraryModal({ entry, open, onOpenChange }: LibraryModalProps) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusValue>(
    entry.status as StatusValue
  );
  const [platform, setPlatform] = useState<string>(entry.platform ?? "");
  const [rating, setRating] = useState<string>(
    entry.rating === null ? "" : String(entry.rating)
  );
  const [startedAt, setStartedAt] = useState<string>(
    dateToInputValue(entry.startedAt)
  );
  const [completedAt, setCompletedAt] = useState<string>(
    dateToInputValue(entry.completedAt)
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const ratingValue = rating === "" ? null : Number.parseInt(rating, 10);
      await updateLibraryItemFn({
        data: {
          itemId: entry.id,
          status,
          platform: platform === "" ? null : platform,
          rating: ratingValue,
          startedAt: inputValueToDate(startedAt),
          completedAt: inputValueToDate(completedAt),
        },
      });
      setError(null);
      toast.success("Library entry updated");
      await router.invalidate();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrigger = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteLibraryItemFn({ data: { itemId: entry.id } });
      setDeleteError(null);
      setShowDeleteConfirm(false);
      toast.success("Removed from library");
      await router.invalidate();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setDeleteError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
  };

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
          <label className="gap-xs flex flex-col text-sm">
            <span>Status</span>
            <select
              aria-label="Status"
              className={cn(selectClasses)}
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusValue)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="gap-xs flex flex-col text-sm">
            <span>Platform</span>
            <select
              aria-label="Platform"
              className={cn(selectClasses)}
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
            >
              <option value="">No platform</option>
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              {platform !== "" && !PLATFORM_OPTIONS.includes(platform) ? (
                <option value={platform}>{platform}</option>
              ) : null}
            </select>
          </label>

          <label className="gap-xs flex flex-col text-sm">
            <span>Rating</span>
            <input
              type="number"
              aria-label="Rating"
              className={cn(inputClasses)}
              min={1}
              max={10}
              step={1}
              value={rating}
              onChange={(event) => setRating(event.target.value)}
            />
          </label>

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

        <div className="border-border gap-md pt-md flex flex-col border-t">
          {!showDeleteConfirm ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteTrigger}
            >
              Remove from library
            </Button>
          ) : (
            <div className="gap-sm flex flex-col">
              <p className="text-sm">
                Remove this game from your library? This cannot be undone.
              </p>
              {deleteError !== null ? (
                <p role="alert" className="text-destructive text-sm">
                  {deleteError}
                </p>
              ) : null}
              <div className="gap-sm flex">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  Confirm
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
