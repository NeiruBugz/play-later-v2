import { useRouter } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import type { LoggableGame } from "@/entities/library-item/api/get-loggable-games.server";
import { getLoggableGamesFn } from "@/features/compose-journal-entry/api/get-loggable-games";
import { logTimeFn } from "@/features/compose-journal-entry/api/log-time-fn";
import { formatHours } from "@/shared/lib/date";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { ModalBody, ModalFooter } from "@/shared/ui/responsive-modal";
import { Textarea } from "@/shared/ui/textarea";

import { useLogFollowUps } from "../../model";
import { LogGamePicker } from "../log-game-picker";
import type { LogFormProps } from "./log-form.type";

type LoadStatus = "loading" | "ready" | "error";

const HOURS_STEP = 0.5;
const MINUTES_PER_HOUR = 60;
const MARK_PLAYING_TOAST_MS = 8000;
const TIME_NEEDS_GAME_MESSAGE = "Choose a game to log time.";

function addHours(current: number, delta: number): number {
  return Math.max(0, Math.round((current + delta) * 10) / 10);
}

export function LogForm({ gameSlug, onClose }: LogFormProps) {
  const router = useRouter();
  const followUps = useLogFollowUps();
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [games, setGames] = useState<LoggableGame[]>([]);
  const [chosenSlug, setChosenSlug] = useState<string | null>(gameSlug ?? null);
  const [hours, setHours] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const loaded = await getLoggableGamesFn();
        if (cancelled) return;
        setGames(loaded);
        setLoadStatus("ready");
      } catch {
        if (cancelled) return;
        setLoadStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chosenGame = games.find((game) => game.slug === chosenSlug) ?? null;
  const hasTime = hours > 0;
  const hasContent = content.trim().length > 0;
  const timeNeedsGame = hasTime && chosenGame === null;
  const isResolvingChosenGame =
    gameSlug !== undefined && loadStatus === "loading";
  const canSubmit =
    (hasTime || hasContent) &&
    !timeNeedsGame &&
    !isResolvingChosenGame &&
    !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const playedMinutes = hasTime
        ? Math.round(hours * MINUTES_PER_HOUR)
        : null;
      const result = await logTimeFn({
        data: {
          gameId: chosenGame?.gameId ?? null,
          content: hasContent ? content.trim() : undefined,
          playedMinutes,
        },
      });
      announceSaved({
        message:
          playedMinutes !== null && chosenGame
            ? `Logged ${formatHours(playedMinutes)} for ${chosenGame.title}`
            : "Note saved",
        game: chosenGame,
        offerMarkPlaying: result.offerMarkPlaying,
      });
      void router.invalidate();
      onClose();
    } catch (error: unknown) {
      toast.error(getUserFacingErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  function announceSaved({
    message,
    game,
    offerMarkPlaying,
  }: {
    message: string;
    game: LoggableGame | null;
    offerMarkPlaying: boolean;
  }) {
    if (!offerMarkPlaying || !game || !followUps) {
      toast(message);
      return;
    }
    toast(message, {
      duration: MARK_PLAYING_TOAST_MS,
      action: {
        label: "Mark as Playing",
        onClick: () => {
          void followUps.markPlaying(game);
        },
      },
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col gap-2"
    >
      <ModalBody className="flex flex-col gap-2">
        <GameSection
          loadStatus={loadStatus}
          games={games}
          chosenGame={chosenGame}
          onChoose={(game) => setChosenSlug(game.slug)}
          onClear={() => setChosenSlug(null)}
        />

        <div className="flex flex-col gap-1">
          <Label>Time played</Label>
          <div className="flex items-center justify-center gap-3.5 py-2">
            <button
              type="button"
              aria-label="Decrease time played by 0.5 hours"
              onClick={() => setHours((prev) => addHours(prev, -HOURS_STEP))}
              disabled={hours <= 0}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-opacity disabled:opacity-40"
            >
              <Minus size={20} aria-hidden />
            </button>
            <div
              role="spinbutton"
              aria-label="Time played"
              aria-valuenow={hours}
              aria-valuemin={0}
              aria-valuetext={`${hours} hours`}
              tabIndex={0}
              className="min-w-24 text-center"
            >
              <span className="font-display text-[2.2rem] leading-none font-bold text-foreground">
                {hours}
              </span>
              <span className="ml-1 text-base text-muted-foreground">h</span>
            </div>
            <button
              type="button"
              aria-label="Increase time played by 0.5 hours"
              onClick={() => setHours((prev) => addHours(prev, HOURS_STEP))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity"
            >
              <Plus size={20} aria-hidden />
            </button>
          </div>
          {timeNeedsGame ? (
            <p role="alert" className="text-sm text-destructive">
              {TIME_NEEDS_GAME_MESSAGE}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="log-form-note">Note</Label>
          <Textarea
            id="log-form-note"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Add a note (optional)"
            className="min-h-[100px]"
          />
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          Save
        </Button>
      </ModalFooter>
    </form>
  );
}

type GameSectionProps = {
  loadStatus: LoadStatus;
  games: LoggableGame[];
  chosenGame: LoggableGame | null;
  onChoose: (game: LoggableGame) => void;
  onClear: () => void;
};

function GameSection({
  loadStatus,
  games,
  chosenGame,
  onChoose,
  onClear,
}: GameSectionProps) {
  if (chosenGame) {
    const coverUrl = chosenGame.coverImage
      ? buildCoverImageUrl(chosenGame.coverImage, "t_cover_small")
      : null;
    return (
      <div
        data-testid="selected-game-header"
        className="flex items-center gap-3 rounded-sm border border-border bg-card p-2.5"
      >
        <div className="size-10 shrink-0 overflow-hidden rounded-sm bg-muted">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`Cover for ${chosenGame.title}`}
              className="size-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 text-sm leading-snug font-semibold text-foreground">
          {chosenGame.title}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Change
        </Button>
      </div>
    );
  }

  if (loadStatus === "loading") {
    return <div className="py-4 text-sm text-muted-foreground">Loading…</div>;
  }

  if (loadStatus === "error") {
    return (
      <div className="py-4 text-sm text-destructive">
        Could not load your library. Please try again.
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        Add a game to your library to log time.
      </p>
    );
  }

  return <LogGamePicker games={games} onSelect={onChoose} />;
}
