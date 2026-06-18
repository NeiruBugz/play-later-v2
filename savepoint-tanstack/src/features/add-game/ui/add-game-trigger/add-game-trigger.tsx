import { Plus } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";

import { AddGameModal } from "../add-game-modal";

export type AddGameTriggerProps = {
  variant?: "button" | "fab";
};

export function AddGameTrigger({ variant = "button" }: AddGameTriggerProps) {
  const [open, setOpen] = useState(false);
  const isFab = variant === "fab";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isFab ? (
          <Button
            type="button"
            aria-label="Add game"
            className={cn(
              "shadow-paper fixed right-4 bottom-20 z-40 h-14 w-14 rounded-full p-0 md:right-6 md:bottom-6",
              "[&_svg]:size-5"
            )}
          >
            <Plus aria-hidden="true" />
          </Button>
        ) : (
          <Button>Add game</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add game</DialogTitle>
          <DialogDescription>
            Search the IGDB catalog and add a game to your library.
          </DialogDescription>
        </DialogHeader>
        <AddGameModal onAdded={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
