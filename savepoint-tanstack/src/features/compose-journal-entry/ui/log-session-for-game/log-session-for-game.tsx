import { useEffect, useState } from "react";

import { getLogSessionGameDataFn } from "@/features/compose-journal-entry/api/get-log-session-game-data";
import type { GetLogSessionGameDataResult } from "@/features/compose-journal-entry/api/get-log-session-game-data.worker";

import { LogSessionContent } from "../log-session-content";
import type { LogSessionForGameProps } from "./log-session-for-game.type";

type Status = "loading" | "ready" | "error";

/**
 * Given a game slug, fetches the game's DB id + the user's playthroughs, then
 * delegates to LogSessionContent with real data.
 */
export function LogSessionForGame({
  game,
  gameTitle,
  coverImage,
  onClose,
}: LogSessionForGameProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [gameData, setGameData] = useState<GetLogSessionGameDataResult | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    void (async () => {
      try {
        const data = await getLogSessionGameDataFn({ data: { slug: game } });
        if (cancelled) return;
        setGameData(data);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [game]);

  if (status === "loading" || !gameData) {
    return (
      <div
        data-testid="log-session-for-game-loading"
        className="text-muted-foreground flex items-center justify-center py-8 text-sm"
      >
        Loading…
      </div>
    );
  }

  return (
    <LogSessionContent
      gameId={gameData.gameId}
      gameTitle={gameTitle}
      coverImage={coverImage}
      playthroughs={gameData.playthroughs}
      preselectedPlaythroughId={gameData.preselectedPlaythroughId}
      onClose={onClose}
    />
  );
}
