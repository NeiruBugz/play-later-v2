import type { LucideIcon } from "lucide-react";
import { z } from "zod";

// Domain model for "what's new" announcements. Ported from
// `savepoint-app/features/whats-new/types.ts`. Categories control the
// header Badge label; `icon` is a Lucide component reference (kept
// out of the Zod schema since it's a function, not serializable).
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

// Zod schema for the serializable subset (used if announcements are ever
// fetched at runtime — today they are a static module-level constant).
export const AnnouncementCategorySchema = z.enum([
  "feature",
  "improvement",
  "integration",
]);

export const FeatureAnnouncementSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: AnnouncementCategorySchema,
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
  publishedAt: z.date(),
  expiresAt: z.date().optional(),
});
