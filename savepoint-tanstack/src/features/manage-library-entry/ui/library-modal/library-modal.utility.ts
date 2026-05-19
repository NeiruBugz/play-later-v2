import { useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import type { LibraryItemWithGame } from "@/entities/library-item/api";

import { updateLibraryItemFn } from "../../api/update-library-item-fn";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export function dateToInputValue(date: Date | null): string {
  if (date === null) return "";
  // Render YYYY-MM-DD for <input type="date">.
  const iso = date.toISOString();
  return iso.slice(0, 10);
}

export function inputValueToDate(raw: string): Date | null {
  if (raw === "") return null;
  return new Date(raw);
}

// ---------------------------------------------------------------------------
// Status / Platform constants
// ---------------------------------------------------------------------------

import { LIBRARY_STATUS_LABELS } from "@/entities/library-item/model";

export const STATUS_VALUES = [
  "WISHLIST",
  "SHELF",
  "UP_NEXT",
  "PLAYING",
  "PLAYED",
] as const satisfies ReadonlyArray<keyof typeof LIBRARY_STATUS_LABELS>;

export type StatusValue = (typeof STATUS_VALUES)[number];

export const PLATFORM_OPTIONS: ReadonlyArray<string> = [
  "PC",
  "PlayStation 5",
  "PlayStation 4",
  "Xbox Series X|S",
  "Xbox One",
  "Nintendo Switch",
];

export const inputClasses =
  "h-10 rounded-lg border border-border bg-card px-md text-sm text-foreground shadow-paper-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

// ---------------------------------------------------------------------------
// Form hook
// ---------------------------------------------------------------------------

type UseLibraryModalFormOptions = {
  entry: LibraryItemWithGame;
  onClose: () => void;
};

export function useLibraryModalForm({ entry, onClose }: UseLibraryModalFormOptions) {
  const router = useRouter();

  const [status, setStatus] = useState<StatusValue>(entry.status as StatusValue);
  const [platform, setPlatform] = useState<string>(entry.platform ?? "");
  const [rating, setRating] = useState<string>(
    entry.rating === null ? "" : String(entry.rating)
  );
  const [startedAt, setStartedAt] = useState<string>(dateToInputValue(entry.startedAt));
  const [completedAt, setCompletedAt] = useState<string>(
    dateToInputValue(entry.completedAt)
  );

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
          startedAt: inputValueToDate(startedAt),
          completedAt: inputValueToDate(completedAt),
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
    // Field state
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
    // Submission
    error,
    isSubmitting,
    handleSubmit,
  };
}
