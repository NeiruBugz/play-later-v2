import { useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import type { LibraryItemWithGame } from "@/entities/library-item/api";
import { LIBRARY_STATUS_VALUES } from "@/entities/library-item/model";

import { updateLibraryItemFn } from "../../api/update-library-item-fn";

export const STATUS_VALUES = LIBRARY_STATUS_VALUES;

export type StatusValue = (typeof STATUS_VALUES)[number];

export const inputClasses =
  "h-10 rounded-lg border border-border bg-card px-md text-sm text-foreground shadow-paper-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type UseLibraryModalFormOptions = {
  entry: LibraryItemWithGame;
  onClose: () => void;
};

export function useLibraryModalForm({
  entry,
  onClose,
}: UseLibraryModalFormOptions) {
  const router = useRouter();

  const [status, setStatus] = useState<StatusValue>(
    entry.status as StatusValue
  );
  const [platform, setPlatform] = useState<string>(entry.platform ?? "");
  const [rating, setRating] = useState<string>(
    entry.rating === null ? "" : String(entry.rating)
  );
  const [startedAt, setStartedAt] = useState<Date | null>(entry.startedAt);
  const [completedAt, setCompletedAtValue] = useState<Date | null>(
    entry.completedAt
  );

  // Setting a completion date implies the game is finished — surface PLAYED in
  // the status select so the two fields cannot silently disagree. Clearing the
  // date leaves the status untouched; the user can still override afterward.
  const setCompletedAt = (value: Date | null) => {
    setCompletedAtValue(value);
    if (value !== null) setStatus("PLAYED");
  };

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          startedAt,
          completedAt,
        },
      });
      setError(null);
      toast.success("Library entry updated");
      await router.invalidate();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
}
