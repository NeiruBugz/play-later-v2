import { useNavigate } from "@tanstack/react-router";
import { Fragment, useSyncExternalStore } from "react";

import { useEveningMinutes } from "@/entities/session/model";
import { useSetStatus } from "@/features/manage-library-entry/model/use-set-status";
import { formatTimeAgo } from "@/shared/lib/date";
import { formatEvenings } from "@/shared/lib/evenings";
import { openGlobalAction } from "@/shared/lib/global-action";
import { useDeviceToday } from "@/shared/lib/hooks/use-device-today";
import { Button } from "@/shared/ui/button";
import { CoverTint } from "@/shared/ui/cover-tint";
import { GameCover } from "@/shared/ui/game-cover";

import {
  useContinueQuestion,
  type ContinueQuestionItem,
  type ContinueQuestionKind,
} from "../../model/use-continue-question";
import type { ContinuePanelProps } from "./continue-panel.type";

const PANEL_CLASS_NAME = "mb-4 rounded-2xl p-4 md:p-6";

const subscribeNever = () => () => undefined;

function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}

function questionVerb(kind: ContinueQuestionKind): string {
  if (kind === "start") return "Start";
  if (kind === "replay") return "Play";
  return "Continue";
}

function hasText(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function describeActivity(item: ContinueQuestionItem): string | null {
  if (!("becamePlayingAt" in item)) return null;
  const hydratedNow = new Date();
  if (item.lastSessionAt) {
    return `Last session ${formatTimeAgo(item.lastSessionAt, hydratedNow)}`;
  }
  if (item.becamePlayingAt) {
    return `Started playing ${formatTimeAgo(item.becamePlayingAt, hydratedNow)}`;
  }
  return null;
}

function ContextLine({ parts }: { parts: string[] }) {
  return (
    <p
      data-testid="continue-panel-context"
      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground"
    >
      {parts.map((part, index) => (
        <Fragment key={part}>
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          <span>{part}</span>
        </Fragment>
      ))}
    </p>
  );
}

type QuestionProps = {
  kind: Exclude<ContinueQuestionKind, "rest">;
  item: ContinueQuestionItem;
  onNotTonight: () => void;
  onFocus: (itemId: number) => void;
};

function Question({ kind, item, onNotTonight, onFocus }: QuestionProps) {
  const navigate = useNavigate();
  const eveningMinutes = useEveningMinutes();
  const hydrated = useHydrated();
  const { setStatus, isPending } = useSetStatus({
    id: item.id,
    gameTitle: item.game.title,
    status: item.status,
    upNextPosition: item.upNextPosition,
    rating: item.rating,
  });

  const activity =
    hydrated && kind === "continue" ? describeActivity(item) : null;
  const upNextParts =
    kind === "continue"
      ? []
      : [
          "First in Up Next",
          formatEvenings(item.game.timeToCreditsSeconds, eveningMinutes),
        ];
  const contextParts = [
    activity,
    ...upNextParts.slice(0, 1),
    item.platform,
    ...upNextParts.slice(1),
  ].filter(hasText);

  function logTime() {
    onFocus(item.id);
    openGlobalAction(navigate, "log-session", item.game.slug);
  }

  function startPlaying() {
    onFocus(item.id);
    void setStatus("PLAYING");
  }

  return (
    <div key={item.id} className="flex animate-in items-start gap-4 fade-in">
      <GameCover
        src={item.game.coverImage}
        name={item.game.title}
        size="xs"
        className="w-16 md:w-20"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-xl leading-tight font-semibold [overflow-wrap:anywhere] md:text-2xl">
            <span className="text-[var(--tint-ink)]">{questionVerb(kind)}</span>{" "}
            {item.game.title}
            {kind === "replay" ? " again" : ""}?
          </h2>
          <ContextLine parts={contextParts} />
        </div>
        <div className="flex flex-wrap gap-2">
          {kind === "continue" ? (
            <Button onClick={logTime}>Log time</Button>
          ) : (
            <Button onClick={startPlaying} disabled={isPending}>
              {kind === "replay" ? "Play again" : "Start playing"}
            </Button>
          )}
          <Button variant="outline" onClick={onNotTonight}>
            Not tonight
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ContinuePanel({ playing, upNextQueue }: ContinuePanelProps) {
  const today = useDeviceToday();
  const { kind, item, notTonight, askAgain, focus } = useContinueQuestion({
    playing,
    upNextQueue,
    today,
  });

  if (kind === "rest") {
    const hasGames = playing.length > 0 || upNextQueue.length > 0;
    if (!hasGames) return null;
    return (
      <CoverTint tint={null} variant="panel" className={PANEL_CLASS_NAME}>
        <div className="flex animate-in flex-col items-start gap-3 fade-in">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl leading-tight font-semibold md:text-2xl">
              Nothing tonight is fine too.
            </h2>
            <p className="text-sm text-muted-foreground">
              Your games will be here when you come back.
            </p>
          </div>
          <Button variant="outline" onClick={askAgain}>
            Ask me again
          </Button>
        </div>
      </CoverTint>
    );
  }

  if (!item) return null;

  const { coverHue, coverChroma } = item.game;
  const tint =
    coverHue === null ? null : { hue: coverHue, chroma: coverChroma ?? 0 };

  return (
    <CoverTint tint={tint} variant="panel" className={PANEL_CLASS_NAME}>
      <Question
        key={item.id}
        kind={kind}
        item={item}
        onNotTonight={notTonight}
        onFocus={focus}
      />
    </CoverTint>
  );
}
