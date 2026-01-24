import { formatRelativeDate } from "@/shared/lib/date";

export function formatPlaytime(minutes: number | null): string {
  if (minutes === null || minutes === 0) {
    return "Never played";
  }

  const hours = minutes / 60;

  if (hours < 1) {
    return `${minutes} min`;
  }

  return `${hours.toFixed(1)} hrs`;
}

export function formatLastPlayed(date: Date | string | null): string {
  if (date === null) {
    return "Never";
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatRelativeDate(dateObj);
}

export function getSteamIconUrl(
  iconHash: string | null,
  appId: string | null
): string | null {
  if (!iconHash || !appId) {
    return null;
  }

  return `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
}
