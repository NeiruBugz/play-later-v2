import { useNavigate } from "@tanstack/react-router";

import { GamePrompts } from "@/features/library-prompts";
import { formatHours } from "@/shared/lib/date";
import { openGlobalAction } from "@/shared/lib/global-action";
import { Card } from "@/shared/ui/card";
import { SectionLabel } from "@/shared/ui/section-label";

import { GameNotesList } from "../game-notes-list";
import { GameRating } from "../game-rating";
import { PlayHistory } from "../play-history";
import type { YourPlayCardProps } from "./your-play-card.type";

const NOTES_PREVIEW_SIZE = 2;

function formatSessionsLine(totalMinutes: number, sessionCount: number) {
  if (sessionCount === 0) return "No sessions yet";
  const noun = sessionCount === 1 ? "session" : "sessions";
  return `${sessionCount} ${noun} · ${formatHours(totalMinutes)}`;
}

export function YourPlayCard({
  entry,
  gameTitle,
  gameSlug,
  prompts,
  notes,
  history,
  playtimeTotalMinutes,
  playtimeSessionCount,
}: YourPlayCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      id="your-play"
      variant="flat"
      data-testid="your-play-card"
      className="flex h-full flex-col gap-3 p-4"
    >
      <SectionLabel>Your play</SectionLabel>
      <p className="text-sm tabular-nums">
        {formatSessionsLine(playtimeTotalMinutes, playtimeSessionCount)}
      </p>
      <GameRating libraryItemId={entry.id} rating={entry.rating} />
      {prompts !== undefined ? (
        <GamePrompts
          libraryItemId={entry.id}
          gameTitle={gameTitle}
          prompts={prompts}
          status={entry.status}
        />
      ) : null}
      <GameNotesList
        notes={notes}
        previewSize={NOTES_PREVIEW_SIZE}
        onNewNote={() => openGlobalAction(navigate, "log-session", gameSlug)}
      />
      <PlayHistory plays={history} />
    </Card>
  );
}
