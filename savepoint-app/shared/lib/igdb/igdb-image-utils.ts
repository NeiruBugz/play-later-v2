import { IMAGE_SIZES } from "@/shared/config/image.config";

export function buildIgdbImageUrl(
  imageId: string,
  imageSize: keyof typeof IMAGE_SIZES = "hd"
) {
  return `https://images.igdb.com/igdb/image/upload/${IMAGE_SIZES[imageSize]}/${imageId}.webp`;
}
