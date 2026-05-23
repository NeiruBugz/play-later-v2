import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";

import { addGameToLibraryFn } from "../../api/add-game-to-library-fn";

type AddFromGameDetailButtonProps = {
  igdbId: number;
  gameTitle: string;
};

export function AddFromGameDetailButton({
  igdbId,
  gameTitle,
}: AddFromGameDetailButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    setIsSubmitting(true);
    try {
      await addGameToLibraryFn({ data: { igdbId } });
      setError(null);
      toast.success("Added to library");
      await router.invalidate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gap-sm flex flex-col">
      <Button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        aria-label={`Add ${gameTitle} to library`}
      >
        Add to library
      </Button>
      {error !== null ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
