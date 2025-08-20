import { Accordion, AccordionItem } from "@/shared/components/ui/accordion";
import { cn } from "@/shared/lib";
import igdbApi from "@/shared/lib/igdb";
import { GAME_TYPE, type FranchiseGamesResponse } from "@/shared/types";

import { Franchise } from "./franchise";

type FranchisesProps = {
  igdbId: number;
  franchisesIdList: number[];
};

export async function Franchises({
  igdbId,
  franchisesIdList,
}: FranchisesProps) {
  let allFranchises: Array<FranchiseGamesResponse[] | undefined> = [];
  if (franchisesIdList && Array.isArray(franchisesIdList)) {
    const promises = franchisesIdList.map((id) =>
      igdbApi.getGameFranchiseGames(id)
    );
    allFranchises = await Promise.all(promises);
  }
  return (
    <div
      className={cn("mt-12", {
        hidden: !allFranchises || allFranchises.length === 0,
      })}
    >
      <h2 className="mb-4 text-2xl font-bold">From the Same Series</h2>
      <Accordion type="single" collapsible>
        {allFranchises.flat().map((franchiseEntry) => {
          if (
            !franchiseEntry ||
            (!franchiseEntry.name && !franchiseEntry?.games.length)
          ) {
            return null;
          }
          const mainFranchiseGames = franchiseEntry?.games.filter(
            (game) =>
              (game.game_type === GAME_TYPE.MAIN_GAME ||
                game.game_type === GAME_TYPE.EXPANDED_GAME) &&
              game.id !== igdbId &&
              !game.name.toLowerCase().includes("edition")
          );
          return (
            <AccordionItem
              value={franchiseEntry?.name}
              key={franchiseEntry?.id}
            >
              <Franchise
                name={franchiseEntry.name}
                games={mainFranchiseGames}
              />
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
