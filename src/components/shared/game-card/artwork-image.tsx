import {
  IMAGE_API,
  IMAGE_SIZES,
  NEXT_IMAGE_SIZES,
} from "@/src/packages/config/site";
import Image from "next/image";

export const ArtworkImage = ({
  imageUrl,
  title,
}: {
  imageUrl: string;
  time: number;
  title: string;
}) => {
  return (
    <Image
      alt={`${title} cover art`}
      className="h-auto flex-shrink-0 rounded-xl object-cover"
      height={NEXT_IMAGE_SIZES["logo"].height}
      src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${imageUrl}.png`}
      style={{
        height: "auto",
        maxWidth: "100%",
      }}
      width={NEXT_IMAGE_SIZES["logo"].width}
    />
  );
};
