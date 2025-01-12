"use client";

import { BacklogStatusMapper, cn, playingOnPlatforms } from "@/src/shared/lib";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/shared/ui/dialog";
import { Label } from "@/src/shared/ui/label";
import { BacklogItemStatus } from "@prisma/client";
import { ListPlus } from "lucide-react";

export function AddToCollectionModal({ gameTitle }: { gameTitle: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn("flex items-center gap-2")}>
          <ListPlus />
          <span>Add to collection</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-1/2 max-w-fit">
        <DialogHeader>
          <DialogTitle>{gameTitle}</DialogTitle>
          <DialogDescription>Add new game to your collection</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="platform" className="w-[80px] text-left">
              Platform
            </Label>
            <Select name="platform" defaultValue="">
              <SelectTrigger className="min-w-[220px]">
                <SelectValue placeholder="Select a platform" className="mt-2" />
              </SelectTrigger>
              <SelectContent>
                {playingOnPlatforms.map((platform) => (
                  <SelectItem value={platform.value} key={platform.value}>
                    {platform.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="status" className="w-[80px] text-left">
              Status
            </Label>
            <Select name="status" defaultValue="">
              <SelectTrigger className="min-w-[220px]">
                <SelectValue
                  placeholder="Select a status"
                  className="mt-2 min-w-[220px]"
                />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(BacklogItemStatus).map((key) => (
                  <SelectItem value={key} key={key}>
                    {BacklogStatusMapper[key as BacklogItemStatus]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
