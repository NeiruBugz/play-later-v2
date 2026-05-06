import { useState } from "react";

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

export function AddGameTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add game</Button>
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
