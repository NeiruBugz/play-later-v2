import "server-only";

import { getGreetingUsername } from "../use-cases/get-greeting-username";
import { getQuickLogPlayingGames } from "../use-cases/get-quick-log-playing-games";
import { QuickLogHeroClient } from "./quick-log-hero-client";

interface QuickLogHeroProps {
  userId: string;
}

export async function QuickLogHero({ userId }: QuickLogHeroProps) {
  const [username, playingGames] = await Promise.all([
    getGreetingUsername({ userId }),
    getQuickLogPlayingGames(userId),
  ]);
  return <QuickLogHeroClient username={username} playingGames={playingGames} />;
}
