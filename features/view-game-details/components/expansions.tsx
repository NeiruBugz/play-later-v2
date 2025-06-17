import { IgdbImage } from "@/shared/components/igdb-image";
import igdbApi from "@/shared/lib/igdb";

type ExpansionsProps = {
  igdbId: number;
};
export async function Expansions({ igdbId }: ExpansionsProps) {
  const dlcAndExpansionList = await igdbApi.getGameDLCsAndExpansions(igdbId);

  if (!dlcAndExpansionList || !dlcAndExpansionList[0]) {
    return null;
  }

  const expansions = dlcAndExpansionList[0].expansions;

  if (!expansions) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="mb-2 font-medium">DLC & Expansions</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {expansions.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <IgdbImage
              gameTitle={item.name}
              coverImageId={item.cover.image_id}
              igdbSrcSize={"hd"}
              igdbImageSize={"c-big"}
              width={60}
              height={60}
              className="rounded"
            />
            <div>
              <p className="font-medium">{item.name}</p>
              {/* <p className="text-sm text-muted-foreground">
              {item.release_dates[0].human}
            </p> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
