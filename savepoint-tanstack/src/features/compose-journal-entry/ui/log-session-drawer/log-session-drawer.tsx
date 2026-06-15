import { useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createJournalEntryFn } from "@/features/compose-journal-entry/api/create-journal-entry-fn";
import { getErrorMessage } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { Textarea } from "@/shared/ui/textarea";

import type { LogSessionDrawerProps } from "./log-session-drawer.type";

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

export function LogSessionDrawer({
  open,
  onOpenChange,
  playthroughs,
  preselectedPlaythroughId,
  gameId,
}: LogSessionDrawerProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(preselectedPlaythroughId);
  const [thoughts, setThoughts] = useState("");
  const [hours, setHours] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedHours = parseFloat(hours);
  const hasPositiveHours = Number.isFinite(parsedHours) && parsedHours > 0;
  const canSubmit = thoughts.trim().length > 0 || hasPositiveHours;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const playedMinutes = hasPositiveHours
        ? Math.round(parsedHours * 60)
        : undefined;

      await createJournalEntryFn({
        data: {
          content: thoughts,
          gameId,
          playedMinutes,
          playthroughId: selectedId,
        },
      });
      await router.invalidate();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Something went wrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Log session</SheetTitle>
          <SheetDescription>
            Record a play session for one of your runs.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="gap-md flex flex-col">
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

          {/* Thoughts */}
          <div className="gap-xs flex flex-col">
            <Label htmlFor="log-session-thoughts">Thoughts</Label>
            <Textarea
              id="log-session-thoughts"
              aria-label="Thoughts"
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              placeholder="How was the session? (optional)"
              className="min-h-[100px]"
            />
            <p className="text-muted-foreground text-xs">
              Logging playtime alone is a complete entry.
            </p>
          </div>

          {/* Hours played */}
          <div className="gap-xs flex flex-col">
            <Label htmlFor="log-session-hours">Hours played</Label>
            <Input
              id="log-session-hours"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              aria-label="Hours played"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0"
            />
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
              Log session
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
