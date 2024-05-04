"use client";

import { Picker } from "@/src/components/library/library/pick-random-game/picker";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/packages/utils";
import { PickerItem } from "@/src/types/library/actions";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const PickerDialog = ({ items }: { items: PickerItem[] }) => {
  const [isOpen, onOpenChange] = useState(false);
  const params = useSearchParams();
  const status = params.get("status");
  if (!status) {
    return;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn("my-2 md:my-0", {
            hidden: status !== "BACKLOG" || items.length === 0,
          })}
          variant="secondary"
        >
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
