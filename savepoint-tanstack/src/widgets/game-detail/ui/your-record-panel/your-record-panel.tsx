import { useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { updateLibraryItemFn } from "@/features/manage-library-entry/api/update-library-item-fn";
import { getErrorMessage } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { RatingInput } from "@/shared/ui/rating-input";

import type { YourRecordPanelProps } from "./your-record-panel.type";

const MINUTES_PER_HOUR = 60;

function toHours(minutes: number): number {
  return Math.round(minutes / MINUTES_PER_HOUR);
}

export function YourRecordPanel({
  itemId,
  rating,
  playtimeTotalMinutes,
  journalCount,
  gameTitle,
  onLogSession,
}: YourRecordPanelProps) {
  const router = useRouter();
  const [optimisticRating, setOptimisticRating] = useState<number | null>(
    rating
  );
  const [pending, setPending] = useState(false);

  const showPlaytime = playtimeTotalMinutes > 0;

  const handleRatingChange = async (next: number | null) => {
    if (itemId === null || pending) return;
    const previous = optimisticRating;
    setOptimisticRating(next);
    setPending(true);
    try {
      const updated = await updateLibraryItemFn({
        data: { itemId, rating: next },
      });
      setOptimisticRating(updated.rating ?? null);
      await router.invalidate();
    } catch (err: unknown) {
      setOptimisticRating(previous);
      toast.error(getErrorMessage(err, "Something went wrong"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="gap-md flex flex-col" data-testid="your-record-panel">
      <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
        {`// YOUR RECORD`}
      </span>

      <div className="gap-sm flex flex-col">
        {showPlaytime ? (
          <StatRow
            term="Playtime"
            value={`${toHours(playtimeTotalMinutes)}h`}
          />
        ) : null}
        <StatRow term="Sessions" value={String(journalCount)} />
      </div>

      {itemId !== null ? (
        <div className="border-border/50 flex items-center justify-between border-t pt-3">
          <span className="text-muted-foreground text-caption tracking-wider uppercase">
            Your rating
          </span>
          <RatingInput
            value={optimisticRating}
            readOnly={false}
            size="md"
            onChange={handleRatingChange}
            aria-label={`Rate ${gameTitle}`}
          />
        </div>
      ) : null}

      <Button
        type="button"
        size="sm"
        className="gap-1.5 self-start"
        onClick={onLogSession}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Log a session
      </Button>
    </div>
  );
}

function StatRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground text-caption tracking-wider uppercase">
        {term}
      </span>
      <span className="text-foreground font-mono text-base font-bold">
        {value}
      </span>
    </div>
  );
}
