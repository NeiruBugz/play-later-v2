const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";
const IGDB_SIZE_SEGMENT_RE = /\/t_[a-z0-9_]+\//;

export type IgdbCoverSize =
  | "t_thumb"
  | "t_cover_small"
  | "t_cover_big"
  | "t_cover_big_2x"
  | "t_720p";

export function buildCoverImageUrl(
  coverImage: string | null | undefined,
  size: IgdbCoverSize = "t_cover_big"
): string | null {
  if (!coverImage) return null;
  if (IGDB_SIZE_SEGMENT_RE.test(coverImage)) {
    return coverImage.replace(IGDB_SIZE_SEGMENT_RE, `/${size}/`);
  }
  if (/^https?:\/\//.test(coverImage)) return coverImage;
  return `${IGDB_IMAGE_BASE}/${size}/${coverImage}.jpg`;
}
