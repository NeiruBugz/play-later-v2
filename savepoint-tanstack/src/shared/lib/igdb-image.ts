const IGDB_IMAGE_BASE = "https://images.igdb.com/igdb/image/upload";
const IGDB_SIZE_SEGMENT_RE = /\/t_[a-z0-9_]+\//;

export type IgdbCoverSize =
  | "t_thumb"
  | "t_cover_small"
  | "t_cover_big"
  | "t_cover_big_2x"
  | "t_screenshot_med"
  | "t_720p"
  | "t_1080p";

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

export function buildScreenshotUrl(
  imageId: string | null | undefined,
  size: IgdbCoverSize = "t_1080p"
): string | null {
  return buildCoverImageUrl(imageId, size);
}

export interface CoverImageProps {
  src: string;
  srcSet: string | undefined;
}

const DENSE_DISPLAY_SIZE: Partial<Record<IgdbCoverSize, IgdbCoverSize>> = {
  t_cover_small: "t_cover_big",
  t_cover_big: "t_cover_big_2x",
};

export function buildCoverImageProps(
  coverImage: string | null | undefined,
  size: IgdbCoverSize = "t_cover_big"
): CoverImageProps | null {
  const src = buildCoverImageUrl(coverImage, size);
  if (!src) return null;
  const denseSize = DENSE_DISPLAY_SIZE[size];
  const srcDense = denseSize ? buildCoverImageUrl(coverImage, denseSize) : null;
  return {
    src,
    srcSet:
      srcDense && srcDense !== src ? `${src} 1x, ${srcDense} 2x` : undefined,
  };
}

export function buildScreenshotThumbUrl(
  imageId: string | null | undefined
): string | null {
  return buildScreenshotUrl(imageId, "t_screenshot_med");
}
