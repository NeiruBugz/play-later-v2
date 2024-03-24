"use client";

import { useState } from "react";
import { Picker } from "@/features/library/ui/pick-random-game/picker";
import { Game } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function PickerDialog({ items }: { items: Game[] }) {
  const [isOpen, onOpenChange] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary">Pick random game</Button>
      </DialogTrigger>
      <DialogContent className="min-h-[500px] min-w-[320px]">
        <DialogHeader>
          <DialogTitle>Backlog picker</DialogTitle>
          <DialogDescription>
            Play a roulette and let the service pick a game from your backlog
          </DialogDescription>
        </DialogHeader>
        <Picker items={items} closeDialog={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export { PickerDialog };
