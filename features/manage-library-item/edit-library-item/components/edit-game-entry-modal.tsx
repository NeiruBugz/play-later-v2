"use client";

import { type LibraryItem } from "@prisma/client";
import { Edit } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { LibraryStatusMapper, normalizeString } from "@/shared/lib";

import { GameEntryForm } from "./game-entry-form";

type EditGameEntryModalProps = {
  libraryItems?: LibraryItem[];
};

export function EditGameEntryModal({ libraryItems }: EditGameEntryModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <Edit size={16} />
        Edit entries
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Game Entry</DialogTitle>
          </DialogHeader>
          <Tabs>
            <TabsList>
              {libraryItems?.map((libraryItem, index) => (
                <TabsTrigger value={index.toString()} key={libraryItem.id}>
                  {normalizeString(libraryItem.platform)} -{" "}
                  {LibraryStatusMapper[libraryItem.status]}
                </TabsTrigger>
              ))}
              <TabsTrigger value="new">New</TabsTrigger>
            </TabsList>
            {libraryItems?.map((libraryItem, index) => (
              <TabsContent value={index.toString()} key={libraryItem.id}>
                <GameEntryForm
                  platform={libraryItem.platform}
                  id={libraryItem.id}
                  status={libraryItem.status}
                  startedAt={libraryItem.startedAt}
                  completedAt={libraryItem.completedAt}
                />
              </TabsContent>
            ))}
            <TabsContent value="new">
              <GameEntryForm
                platform={""}
                id={0}
                status={"CURIOUS_ABOUT"}
                startedAt={null}
                completedAt={null}
                gameId={libraryItems?.[0]?.gameId}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
