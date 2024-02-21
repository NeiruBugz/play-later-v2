import { AddForm } from "@/features/library/ui/add-game/form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog"

function AddDialog({ entry }: { entry: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add game</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>Add a game</DialogHeader>
        <section>
          <AddForm game={entry} withDescription={false} />
        </section>
      </DialogContent>
    </Dialog>
  )
}

export { AddDialog }
