import { Download } from "lucide-react";

import type { FeatureAnnouncement } from "./model/types";

// Bump this string whenever a new announcement should re-trigger the modal for every user.
export const CURRENT_VERSION = "2026-05-20-v1";

export const WHATS_NEW_STORAGE_KEY = "whatsNewLastSeenVersion";

export const ANNOUNCEMENTS: FeatureAnnouncement[] = [
  {
    id: "steam-import-2025-01",
    title: "Steam Library Import",
    description:
      "Connect your Steam account to import your game library automatically. Your games, playtime, and achievements will sync to your SavePoint library.",
    category: "integration",
    icon: Download,
    ctaLabel: "Connect Steam",
    ctaUrl: "/settings/account",
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
