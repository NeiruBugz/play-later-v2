import Image, { ImageProps } from "next/image";
import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/packages/config/igdb.config";
import { isURL } from "@/src/packages/utils";

type CustomImageProps = {
  imageUrl: string;
  size: keyof typeof IMAGE_SIZES;
} & Omit<ImageProps, "height" | "src" | "width">;

export const CustomImage = ({ imageUrl, size, ...props }: CustomImageProps) => {
  const { height, width } = NEXT_IMAGE_SIZES[size];
  const { alt, ...rest } = props;
  const buildSrcUrl = isURL(imageUrl)
    ? imageUrl
    : `${IMAGE_API}/${IMAGE_SIZES["hd"]}/${imageUrl}.png`;
  return (
    <Image
      {...rest}
      alt={alt}
      height={height}
      src={buildSrcUrl}
      width={width}
    />
  );
};
