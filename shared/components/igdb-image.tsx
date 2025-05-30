import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/shared/config/image.config";
import Image, { ImageProps } from "next/image";

type IgdbImageProps = {
  gameTitle: string;
  coverImageId: string | null;
  igdbSrcSize: keyof typeof IMAGE_SIZES;
  igdbImageSize: keyof typeof IMAGE_SIZES;
} & Partial<ImageProps>;

function IgdbImage({
  gameTitle,
  igdbImageSize,
  igdbSrcSize,
  coverImageId,
  ...rest
}: IgdbImageProps) {
  const src = coverImageId
    ? `${IMAGE_API}/${IMAGE_SIZES[igdbSrcSize]}/${coverImageId}.webp`
    : undefined;

  if (!src) {
    return;
  }

  const dimensions = !rest.fill
    ? {
        width: rest.width || NEXT_IMAGE_SIZES[igdbImageSize].width,
        height: rest.height || NEXT_IMAGE_SIZES[igdbImageSize].height,
      }
    : {};

  return (
    <Image src={src} alt={`${gameTitle} cover art`} {...dimensions} {...rest} />
  );
}

export { IgdbImage };
