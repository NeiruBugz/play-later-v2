import { Download } from "lucide-react";

import type { FeatureAnnouncement } from "./types";

export const STORAGE_KEY = "savepoint:seen-announcements";

export const ANNOUNCEMENTS: FeatureAnnouncement[] = [
  {
    id: "steam-import-2025-01",
    title: "Steam Library Import",
    description:
      "Connect your Steam account to import your game library automatically. Your games, playtime, and achievements will sync to your SavePoint library.",
    category: "integration",
    icon: Download,
    ctaLabel: "Connect Steam",
    ctaUrl: "/profile/settings",
    publishedAt: new Date("2025-01-20"),
  },
];

export function getActiveAnnouncements(): FeatureAnnouncement[] {
  const now = new Date();
  return ANNOUNCEMENTS.filter((announcement) => {
    const isPublished = announcement.publishedAt <= now;
    const isNotExpired =
      !announcement.expiresAt || announcement.expiresAt > now;
    return isPublished && isNotExpired;
  });
}
