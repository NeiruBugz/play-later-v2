const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";
const IGDB_SIZE_SEGMENT_RE = /\/t_[a-z0-9_]+\//;

export type IgdbCoverSize =
  | "t_thumb"
  | "t_cover_small"
  | "t_cover_big"
  | "t_cover_big_2x"
  | "t_720p"
  | "t_1080p";

export const IGDB_COVER_DIMENSIONS: Record<
  IgdbCoverSize,
  { width: number; height: number }
> = {
  t_thumb: { width: 90, height: 90 },
  t_cover_small: { width: 90, height: 128 },
  t_cover_big: { width: 264, height: 374 },
  t_cover_big_2x: { width: 528, height: 748 },
  t_720p: { width: 1280, height: 720 },
  t_1080p: { width: 1920, height: 1080 },
};

export function buildCoverImageUrl(
  coverImage: string | null | undefined,
  size: IgdbCoverSize = "t_720p"
): string | null {
  if (!coverImage) return null;
  if (IGDB_SIZE_SEGMENT_RE.test(coverImage)) {
    return coverImage.replace(IGDB_SIZE_SEGMENT_RE, `/${size}/`);
  }
  if (/^https?:\/\//.test(coverImage)) return coverImage;
  return `${IGDB_IMAGE_BASE}/${size}/${coverImage}.jpg`;
}
