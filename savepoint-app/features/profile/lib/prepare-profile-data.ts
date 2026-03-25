import type { ProfileWithStats } from "@/data-access-layer/services";

export function prepareProfileData(profile: ProfileWithStats) {
  const displayName =
    profile.username || profile.name || profile.email || "User";
  const joinDate = new Date(profile.createdAt);
  const joinDateFormatted = joinDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const statusEntries = Object.entries(profile.stats.statusCounts).filter(
    ([, count]) => count > 0
  );
  const totalGames = statusEntries.reduce((sum, [, count]) => sum + count, 0);
  const quickStats = {
    totalGames,
    playing: profile.stats.statusCounts["PLAYING"] ?? 0,
    completed: profile.stats.statusCounts["PLAYED"] ?? 0,
    journalEntries: profile.stats.journalCount,
  };
  return {
    displayName,
    joinDateFormatted,
    statusEntries,
    quickStats,
  };
}
