"use client";

import { BacklogItem } from "@prisma/client";
import { Edit } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/tabs";
import { BacklogStatusMapper, normalizeString } from "@/shared/lib";

import { GameEntryForm } from "./game-entry-form";

interface EditGameEntryModalProps {
  backlogItems?: BacklogItem[];
}

export function EditGameEntryModal({ backlogItems }: EditGameEntryModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Edit size={16} />
        Edit entries
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Game Entry</DialogTitle>
          </DialogHeader>
          <Tabs>
            <TabsList>
              {backlogItems?.map((backlogItem, index) => (
                <TabsTrigger value={index.toString()} key={backlogItem.id}>
                  {normalizeString(backlogItem.platform)} -{" "}
                  {BacklogStatusMapper[backlogItem.status]}
                </TabsTrigger>
              ))}
            </TabsList>
            {backlogItems?.map((backlogItem, index) => (
              <TabsContent value={index.toString()} key={backlogItem.id}>
                <GameEntryForm
                  platform={backlogItem.platform}
                  id={backlogItem.id}
                  status={backlogItem.status}
                  startedAt={backlogItem.startedAt}
                  completedAt={backlogItem.completedAt}
                />
              </TabsContent>
            ))}
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
