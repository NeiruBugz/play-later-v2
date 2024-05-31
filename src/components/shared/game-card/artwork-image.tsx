import { CustomImage } from "@/src/shared/ui/custom-image";

export const ArtworkImage = ({
  imageUrl,
  title,
}: {
  imageUrl: string;
  time: number;
  title: string;
}) => {
  return (
    <CustomImage
      alt={`${title} cover art`}
      className="h-auto flex-shrink-0 rounded-xl object-cover"
      imageUrl={imageUrl}
      size="logo"
      style={{
        height: "auto",
        maxWidth: "100%",
      }}
    />
  );
};
