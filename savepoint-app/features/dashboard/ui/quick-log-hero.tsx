import "server-only";

import { getQuickLogPlayingGames } from "../use-cases/get-quick-log-playing-games";
import { QuickLogHeroClient } from "./quick-log-hero-client";

interface QuickLogHeroProps {
  userId: string;
  username: string;
}

export async function QuickLogHero({ userId, username }: QuickLogHeroProps) {
  const playingGames = await getQuickLogPlayingGames(userId);
  return <QuickLogHeroClient username={username} playingGames={playingGames} />;
}
