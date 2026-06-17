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
}: LogSessionDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
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
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
