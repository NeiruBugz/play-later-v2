"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Picker } from "@/src/components/library/library/pick-random-game/picker";
import type { PickerItem } from "@/src/types/library/actions";
import { cn } from "@/src/shared/lib/tailwind-merge";
import { Button } from "@/src/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/shared/ui/dialog";

const PickerDialog = ({ items }: { items: PickerItem[] }) => {
  const [isOpen, onOpenChange] = useState(false);
  const params = useSearchParams();
  const status = params.get("status");
  if (!status || status !== "BACKLOG") {
    return;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogTrigger asChild>
        <Button className={cn("my-2 md:my-0")} variant="secondary">
          Pick random game
        </Button>
      </DialogTrigger>
      <DialogContent className="min-h-[500px] min-w-[320px]">
        <DialogHeader>
          <DialogTitle>Backlog picker</DialogTitle>
          <DialogDescription>
            Play a roulette and let the service pick a game from your backlog
          </DialogDescription>
        </DialogHeader>
        <Picker closeDialog={() => onOpenChange(false)} items={items} />
      </DialogContent>
    </Dialog>
  );
};

export { PickerDialog };
