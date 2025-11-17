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
  return {
    displayName,
    joinDateFormatted,
    statusEntries,
  };
}
