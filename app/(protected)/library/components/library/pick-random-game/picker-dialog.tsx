"use client";

import { Picker } from "@/app/(protected)/library/components/library/pick-random-game/picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Game } from "@prisma/client";
import { useState } from "react";

function PickerDialog({ items }: { items: Game[] }) {
  const [isOpen, onOpenChange] = useState(false);
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogTrigger asChild>
        <Button className="my-2 md:my-0" variant="secondary">
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
}

export { PickerDialog };
