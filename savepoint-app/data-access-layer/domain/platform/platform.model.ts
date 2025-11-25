/**
 * Domain model for a gaming platform.
 * Represents a platform where games can be played (e.g., PlayStation 5, Nintendo Switch).
 */
export interface PlatformDomain {
  id: string;
  igdbId: number;
  name: string;
  slug: string;
  abbreviation: string | null;
  alternativeName: string | null;
  generation: number | null;
  platformFamily: number | null;
  platformType: number | null;
  checksum: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Simplified platform for list displays and dropdowns.
 * Contains only essential fields for UI selection.
 */
export interface PlatformSummaryDomain {
  id: string;
  name: string;
  slug: string;
}
