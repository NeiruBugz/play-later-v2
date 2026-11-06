import { useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import type { LibraryItemWithGame } from "@/entities/library-item/api";
import { getErrorMessage } from "@/shared/lib/errors";

import { updateLibraryItemFn } from "../../api/update-library-item-fn";

export const inputClasses =
  "h-10 rounded-lg border border-border bg-card px-2 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type UseLibraryModalFormOptions = {
  entry: LibraryItemWithGame;
  onClose: () => void;
};

export function useLibraryModalForm({
  entry,
  onClose,
}: UseLibraryModalFormOptions) {
  const router = useRouter();

  const [platform, setPlatform] = useState<string>(entry.platform ?? "");
  const [rating, setRating] = useState<string>(
    entry.rating === null ? "" : String(entry.rating)
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
          platform: platform === "" ? null : platform,
          rating: ratingValue,
        },
      });
      setError(null);
      toast.success("Game updated");
      await router.invalidate();
      onClose();
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update game");
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    platform,
    setPlatform,
    rating,
    setRating,
    error,
    isSubmitting,
    handleSubmit,
  };
}
