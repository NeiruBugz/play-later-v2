import { secondsToHours } from "date-fns";
import { Clock } from "lucide-react";

import { Body, Caption } from "@/shared/components/typography";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import igdbApi from "@/shared/lib/igdb";

export async function TimesToBeat({ igdbId }: { igdbId: number }) {
  const ttb = await igdbApi.getGameTimeToBeats(igdbId);

  if (!ttb) {
    return null;
  }

  const [current] = ttb;

  if (!current?.normally) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="size-4" />
            <Body size="sm">
              {secondsToHours(current.normally)} hours{" "}
              <Caption size="sm">
                (based on {current.count} submissions)
              </Caption>
            </Body>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div>
            <Body size="sm">Hastily: {secondsToHours(current.hastily)} h.</Body>
            <Body size="sm">
              Completionist: {secondsToHours(current.completely)} h.
            </Body>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
