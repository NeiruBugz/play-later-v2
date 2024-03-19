"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteList } from "@/features/lists"
import { List } from "@prisma/client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

function DeleteDialog({
  id,
  listName,
}: {
  id: List["id"]
  listName: List["name"]
}) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const showToast = (type: "success" | "error") => {
    if (type === "success") {
      toast({
        title: "Success",
        description: `${listName} was successfully deleted`,
        duration: 2000,
      })
      return
    }

    if (type === "error") {
      toast({
        title: "Oops, something happened",
        description: `We couldn't delete ${listName} list`,
        variant: "destructive",
        duration: 2000,
      })
      return
    }
  }

  const onDelete = async () => {
    try {
      await deleteList(id)
      setOpen(false)
      showToast("success")
      router.back()
    } catch (error) {
      console.error(error)
      showToast("success")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete list</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete list</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to delete this list?</p>
        <p>This action cannot be undone.</p>
        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete list
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DeleteDialog }
