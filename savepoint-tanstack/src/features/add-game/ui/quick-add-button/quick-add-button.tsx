import { useRouter } from "@tanstack/react-router";
import { Check, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/shared/lib/errors";
import { cn } from "@/shared/lib/utils";

import { addGameToLibraryFn } from "../../api/add-game-to-library-fn";
import type { QuickAddButtonProps } from "./quick-add-button.type";

type Phase = "idle" | "adding" | "added";

/**
 * One-tap add for a search result. Adds the game at its default status
 * (SHELF) without opening the full add modal — the compact "+" affordance
 * F08 surfaces on unowned search cards. Once added, it locks into a checkmark
 * so the row reads as owned without a full page refresh.
 */
export function QuickAddButton({ igdbId, gameTitle }: QuickAddButtonProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");

  const handleClick = async () => {
    if (phase !== "idle") return;
    setPhase("adding");
    try {
      await addGameToLibraryFn({ data: { igdbId } });
      setPhase("added");
      toast.success(`Added ${gameTitle} to library`);
      await router.invalidate();
    } catch (err: unknown) {
      setPhase("idle");
      toast.error(getErrorMessage(err, "Could not add game to library"));
    }
  };

  const isAdded = phase === "added";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={phase !== "idle"}
      aria-busy={phase === "adding"}
      aria-label={
        isAdded ? `${gameTitle} added` : `Add ${gameTitle} to library`
      }
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-md transition-colors [&_svg]:size-4",
        isAdded
          ? "bg-[var(--status-played)] text-white"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
    >
      {phase === "adding" ? (
        <Loader2 aria-hidden="true" className="animate-spin" />
      ) : isAdded ? (
        <Check aria-hidden="true" />
      ) : (
        <Plus aria-hidden="true" />
      )}
    </button>
  );
}
