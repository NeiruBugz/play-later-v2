import { Download } from "lucide-react";

import type { FeatureAnnouncement } from "./model/types";

// Version string compared against the value stored under
// WHATS_NEW_STORAGE_KEY. Bump this string whenever a new announcement
// should re-trigger the modal for every user.
export const CURRENT_VERSION = "2026-05-20-v1";

// localStorage key the modal reads on mount to decide whether to open.
// Value is a single version string (NOT a JSON list of seen IDs — that
// is canonical's shape; tanstack uses a single-version model to keep the
// dismiss contract simple). See DIVERGENCES.md → Slice 20.
export const WHATS_NEW_STORAGE_KEY = "whatsNewLastSeenVersion";

// Active announcements rendered inside the modal. Same payload shape as
// canonical `savepoint-app/features/whats-new/config.ts` — kept as a
// list so future entries can be appended without reshaping the UI.
export const ANNOUNCEMENTS: FeatureAnnouncement[] = [
  {
    id: "steam-import-2025-01",
    title: "Steam Library Import",
    description:
      "Connect your Steam account to import your game library automatically. Your games, playtime, and achievements will sync to your SavePoint library.",
    category: "integration",
    icon: Download,
    ctaLabel: "Connect Steam",
    ctaUrl: "/settings/profile",
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
