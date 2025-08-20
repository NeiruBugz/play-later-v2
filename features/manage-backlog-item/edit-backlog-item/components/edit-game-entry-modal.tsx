"use client";

import { type BacklogItem } from "@prisma/client";
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
import { BacklogStatusMapper, normalizeString } from "@/shared/lib";

import { GameEntryForm } from "./game-entry-form";

type EditGameEntryModalProps = {
  backlogItems?: BacklogItem[];
};

export function EditGameEntryModal({ backlogItems }: EditGameEntryModalProps) {
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
        <Edit className="size-4 text-muted-foreground" />
        <span>Edit entries</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-2xl">
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
              <TabsTrigger value="new">New</TabsTrigger>
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
            <TabsContent value="new">
              <GameEntryForm
                platform={""}
                id={0}
                status={"TO_PLAY"}
                startedAt={null}
                completedAt={null}
                gameId={backlogItems?.[0]?.gameId}
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
