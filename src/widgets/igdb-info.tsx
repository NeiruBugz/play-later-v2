import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/shared/ui/accordion";
import { GameScreenshots } from "@/src/widgets/game-screenshots";
import { SimilarGames } from "@/src/widgets/similar-games";
import { Suspense } from "react";

export function IgdbInfo({
  igdbId,
  gameName,
}: {
  igdbId: number;
  gameName: string;
}) {
  return (
    <div>
      <Accordion type="single" collapsible>
        <AccordionItem value="screenshots">
          <AccordionTrigger className="scroll-m-20 text-xl font-semibold tracking-tight">
            Screenshots
          </AccordionTrigger>
          <AccordionContent>
            <Suspense fallback="Loading...">
              <GameScreenshots gameId={igdbId} gameName={gameName} />
            </Suspense>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Suspense>
        <SimilarGames igdbId={igdbId} />
      </Suspense>
    </div>
  );
}
