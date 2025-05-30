import { Button } from "@/shared/components";
import {
  AccordionContent,
  AccordionTrigger,
} from "@/shared/components/accordion";
import { IgdbImage } from "@/shared/components/igdb-image";
import { FranchiseGamesResponse } from "@/shared/types";

type FranchiseProps = {
  name: string;
  games: FranchiseGamesResponse["games"];
};

export function Franchise({ name, games }: FranchiseProps) {
  return (
    <>
      <AccordionTrigger>
        <h3 className="mb-2 font-medium">{name}</h3>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {games?.map((game) => {
            if (!game || !game.cover || !game.cover?.image_id) {
              return null;
            }
            return (
              <div key={game.id} className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg border">
                  <IgdbImage
                    gameTitle={game.name}
                    coverImageId={game.cover.image_id}
                    igdbSrcSize={"hd"}
                    igdbImageSize={"c-sm"}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="secondary" size="sm" disabled>
                      View Details
                    </Button>
                  </div>
                </div>
                <h3 className="mt-2 truncate text-sm font-medium">
                  {game.name}
                </h3>
                {/* <p className="text-xs text-muted-foreground">
                  {relatedGame.releaseDate}
                </p> */}
              </div>
            );
          })}
        </div>
      </AccordionContent>
    </>
  );
}
