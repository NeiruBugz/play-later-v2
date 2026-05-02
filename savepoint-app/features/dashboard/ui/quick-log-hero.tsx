import "server-only";

import { ProfileService } from "@/data-access-layer/services";

import { getQuickLogPlayingGames } from "../use-cases/get-quick-log-playing-games";
import { QuickLogHeroClient } from "./quick-log-hero-client";

interface QuickLogHeroProps {
  userId: string;
}

export async function QuickLogHero({ userId }: QuickLogHeroProps) {
  const service = new ProfileService();

  let username = "there";
  try {
    const profile = await service.getProfileWithStats({ userId });
    username = profile.username ?? "there";
  } catch {
    // non-critical — greeting still renders with fallback
  }

  const playingGames = await getQuickLogPlayingGames(userId);
  return <QuickLogHeroClient username={username} playingGames={playingGames} />;
}
