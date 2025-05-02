import { IgdbImage } from "@/shared/components/igdb-image";
import igdbApi from "@/shared/lib/igdb";

export async function Artwork({
  igdbId,
  gameTitle,
}: {
  igdbId: number;
  gameTitle: string;
}) {
  const artworks = await igdbApi.getArtworks(igdbId);

  return artworks?.length ? (
    <IgdbImage
      gameTitle={gameTitle}
      coverImageId={
        artworks[Math.floor(Math.random() * artworks.length)].image_id
      }
      igdbSrcSize={"full-hd"}
      igdbImageSize={"full-hd"}
      height={900}
      className="absolute w-full"
    />
  ) : null;
}
