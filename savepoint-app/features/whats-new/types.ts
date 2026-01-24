import type { LucideIcon } from "lucide-react";

export type AnnouncementCategory = "feature" | "improvement" | "integration";

export interface FeatureAnnouncement {
  id: string;
  title: string;
  description: string;
  category: AnnouncementCategory;
  icon?: LucideIcon;
  ctaLabel?: string;
  ctaUrl?: string;
  publishedAt: Date;
  expiresAt?: Date;
}
