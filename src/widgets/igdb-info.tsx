import { Suspense } from "react";
import { GameScreenshots } from "@/src/widgets/game-screenshots";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/shared/ui/accordion";

export function IgdbInfo({
  igdbId,
  gameName,
}: {
  igdbId: number | undefined | null;
  gameName: string;
}) {
  return (
    <div>
      <Accordion type="single" collapsible>
        <AccordionItem value="screenshots">
          <AccordionTrigger>Screenshots</AccordionTrigger>
          <AccordionContent>
            <Suspense fallback="Loading...">
              <GameScreenshots gameId={igdbId} gameName={gameName} />
            </Suspense>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
