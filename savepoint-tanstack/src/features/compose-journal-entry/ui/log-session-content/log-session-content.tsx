import { useRouter } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createJournalEntryFn } from "@/features/compose-journal-entry/api/create-journal-entry-fn";
import { getErrorMessage } from "@/shared/lib/errors";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { SheetFooter } from "@/shared/ui/sheet";
import { Textarea } from "@/shared/ui/textarea";

import type { LogSessionContentProps } from "./log-session-content.type";

const KIND_LABEL: Record<string, string> = {
  FIRST: "First playthrough",
  REPLAY: "Replay",
};

function buildRunLabel(playthrough: {
  kind: string;
  platform: string | null;
}): string {
  const kindLabel = KIND_LABEL[playthrough.kind] ?? playthrough.kind;
  if (!playthrough.platform) return kindLabel;
  return `${kindLabel} · ${playthrough.platform}`;
}

const STEP = 0.5;

export function LogSessionContent({
  playthroughs = [],
  preselectedPlaythroughId = "",
  gameId = "",
  gameTitle,
  playthroughName,
  coverImage,
  onClose,
}: LogSessionContentProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(preselectedPlaythroughId);
  const [reflection, setReflection] = useState("");
  const [hours, setHours] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedId(preselectedPlaythroughId);
  }, [preselectedPlaythroughId]);

  const hasPositiveHours = hours > 0;
  const canSubmit = reflection.trim().length > 0 || hasPositiveHours;

  const handleDecrement = () => {
    setHours((prev) => Math.max(0, Math.round((prev - STEP) * 10) / 10));
  };

  const handleIncrement = () => {
    setHours((prev) => Math.round((prev + STEP) * 10) / 10);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const playedMinutes = hasPositiveHours
        ? Math.round(hours * 60)
        : undefined;

      await createJournalEntryFn({
        data: {
          content: reflection,
          gameId,
          playedMinutes,
          playthroughId: selectedId || undefined,
        },
      });
      await router.invalidate();
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Something went wrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const coverUrl = coverImage
    ? buildCoverImageUrl(coverImage, "t_cover_small")
    : null;

  return (
    <form onSubmit={handleSubmit} className="gap-md flex flex-col">
      {/* Selected-game header card */}
      {gameTitle ? (
        <div
          data-testid="selected-game-header"
          className="bg-card border-border flex items-center gap-3 rounded-[var(--radius-btn)] border p-2.5"
        >
          <div className="size-10 shrink-0 overflow-hidden rounded-[5px]">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={`Cover for ${gameTitle}`}
                className="size-full object-cover"
              />
            ) : (
              <div
                className="bg-muted flex size-full items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-caption text-muted-foreground font-mono select-none">
                  {gameTitle.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-foreground text-sm leading-snug font-semibold">
              {gameTitle}
            </div>
            {playthroughName ? (
              <div className="text-muted-foreground text-xs">
                {playthroughName}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Run picker */}
      {playthroughs.length > 1 ? (
        <fieldset className="gap-xs flex flex-col">
          <legend className="text-muted-foreground mb-1 text-sm">
            Playthrough
          </legend>
          {playthroughs.map((pt) => {
            const label = buildRunLabel(pt);
            return (
              <label
                key={pt.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="playthrough"
                  value={pt.id}
                  checked={selectedId === pt.id}
                  onChange={() => setSelectedId(pt.id)}
                  aria-label={label}
                />
                {label}
              </label>
            );
          })}
        </fieldset>
      ) : (
        playthroughs.map((pt) => {
          const label = buildRunLabel(pt);
          return (
            <input
              key={pt.id}
              type="radio"
              name="playthrough"
              value={pt.id}
              checked={selectedId === pt.id}
              onChange={() => setSelectedId(pt.id)}
              aria-label={label}
              className="sr-only"
            />
          );
        })
      )}

      {/* Playtime stepper */}
      <div className="gap-xs flex flex-col">
        <Label>Playtime</Label>
        <div className="flex items-center justify-center gap-3.5 py-2">
          <button
            type="button"
            aria-label="Decrease playtime by 0.5 hours"
            onClick={handleDecrement}
            disabled={hours <= 0}
            className="border-border bg-card text-foreground flex h-11 w-11 items-center justify-center rounded-full border transition-opacity disabled:opacity-40"
          >
            <Minus size={20} aria-hidden />
          </button>

          <div
            role="spinbutton"
            aria-label="Hours played"
            aria-valuenow={hours}
            aria-valuemin={0}
            aria-valuetext={`${hours} hours`}
            tabIndex={0}
            className="min-w-24 text-center"
          >
            <span className="text-foreground font-display text-[2.2rem] leading-none font-bold">
              {hours}
            </span>
            <span className="text-muted-foreground ml-1 text-base">hrs</span>
          </div>

          <button
            type="button"
            aria-label="Increase playtime by 0.5 hours"
            onClick={handleIncrement}
            className="bg-primary text-primary-foreground flex h-11 w-11 items-center justify-center rounded-full transition-opacity"
          >
            <Plus size={20} aria-hidden />
          </button>
        </div>
      </div>

      {/* Reflection */}
      <div className="gap-xs flex flex-col">
        <Label htmlFor="log-session-reflection">Reflection</Label>
        <Textarea
          id="log-session-reflection"
          aria-label="Reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="What stayed with you tonight?"
          className="min-h-[100px]"
        />
        <p className="text-muted-foreground text-xs">
          Optional — playtime alone is a complete log.
        </p>
      </div>

      <SheetFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !canSubmit}>
          Log session
        </Button>
      </SheetFooter>
    </form>
  );
}
