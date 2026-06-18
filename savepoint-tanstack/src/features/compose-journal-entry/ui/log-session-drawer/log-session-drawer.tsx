import { useIsDesktop } from "@/shared/lib/use-media-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";

import { LogSessionContent } from "../log-session-content";
import type { LogSessionDrawerProps } from "./log-session-drawer.type";

export function LogSessionDrawer({
  open,
  onOpenChange,
  playthroughs,
  preselectedPlaythroughId,
  gameId,
  gameTitle,
  coverImage,
}: LogSessionDrawerProps) {
  const isDesktop = useIsDesktop();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isDesktop ? "right" : "bottom"}>
        <SheetHeader>
          <SheetTitle>Log session</SheetTitle>
          <SheetDescription>
            Record a play session for one of your runs.
          </SheetDescription>
        </SheetHeader>
        <LogSessionContent
          playthroughs={playthroughs}
          preselectedPlaythroughId={preselectedPlaythroughId}
          gameId={gameId}
          gameTitle={gameTitle}
          coverImage={coverImage}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
