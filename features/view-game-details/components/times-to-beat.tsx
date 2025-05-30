import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/tooltip";
import igdbApi from "@/shared/lib/igdb";
import { secondsToHours } from "date-fns";
import { Clock } from "lucide-react";

export async function TimesToBeat({ igdbId }: { igdbId: number }) {
  const ttb = await igdbApi.getGameTimeToBeats(igdbId);

  if (!ttb) {
    return null;
  }

  const [current] = ttb;

  if (!current || !current.normally) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              {secondsToHours(current.normally)} hours{" "}
              <span className="text-xs">
                (based on {current.count} submissions)
              </span>
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div>
            <p>Hastily: {secondsToHours(current.hastily)} h.</p>
            <p>Completionist: {secondsToHours(current.completely)} h.</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
