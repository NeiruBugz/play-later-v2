/**
 * Data Transfer Object for platforms exposed through API endpoints.
 * Serializes dates to ISO strings for JSON compatibility.
 */
export interface PlatformDTO {
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
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified platform DTO for list displays and dropdowns.
 */
export interface PlatformSummaryDTO {
  id: string;
  name: string;
  slug: string;
}
