import type { LucideIcon } from "lucide-react";
import { z } from "zod";

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
