"use client";

import type { LibraryItem } from "@prisma/client";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

import { AddEntryForm } from "./add-entry-form";
import { getStatusLabel } from "./constants";
import { EditEntryForm } from "./edit-entry-form";

type LibraryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  igdbId: number;
  gameTitle: string;
  mode: "add" | "edit";
  existingItems?: LibraryItem[];
};

export const LibraryModal = ({
  isOpen,
  onClose,
  igdbId,
  gameTitle,
  mode,
  existingItems = [],
}: LibraryModalProps) => {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (mode === "edit" && existingItems.length > 0 && !selectedItemId) {
      setSelectedItemId(existingItems[0].id);
      setActiveTab(existingItems[0].id.toString());
    }
  }, [mode, existingItems, selectedItemId]);

  const handleClose = () => {
    setSelectedItemId(null);
    setActiveTab("");
    onClose();
  };

  const handleItemSelect = (itemId: number) => {
    setSelectedItemId(itemId);
    setActiveTab(itemId.toString());
  };

  const handleSuccess = () => {
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add to Library" : "Manage Library"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? `Add ${gameTitle} to your library and set your journey status.`
              : `Update your library entries for ${gameTitle}.`}
          </DialogDescription>
        </DialogHeader>

        {mode === "add" ? (
          <AddEntryForm
            igdbId={igdbId}
            gameTitle={gameTitle}
            onSuccess={handleSuccess}
            onCancel={handleClose}
          />
        ) : (
          <div className="space-y-4">
            {existingItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No library entries found for this game.
              </p>
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value);
                  if (value !== "add-new") {
                    handleItemSelect(Number(value));
                  }
                }}
              >
                <TabsList className="inline-flex w-auto gap-1 bg-transparent">
                  {existingItems.map((item) => (
                    <TabsTrigger
                      key={item.id}
                      value={item.id.toString()}
                      className="hover:border-secondary data-[state=active]:border-primary cursor-pointer rounded-none border-b border-transparent"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-muted-foreground overflow-x">
                          {getStatusLabel(item.status)}
                        </span>
                      </div>
                    </TabsTrigger>
                  ))}
                  <TabsTrigger
                    value="add-new"
                    className="hover:border-secondary data-[state=active]:border-primary cursor-pointer rounded-none border-b border-transparent"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    <span className="font-medium">Add New</span>
                  </TabsTrigger>
                </TabsList>

                {existingItems.map((item) => (
                  <TabsContent
                    key={item.id}
                    value={item.id.toString()}
                    className="mt-4"
                  >
                    <EditEntryForm
                      item={item}
                      onSuccess={handleSuccess}
                      onCancel={handleClose}
                    />
                  </TabsContent>
                ))}

                <TabsContent value="add-new" className="mt-4">
                  <AddEntryForm
                    igdbId={igdbId}
                    gameTitle={gameTitle}
                    isEditMode
                    onSuccess={handleSuccess}
                    onCancel={handleClose}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
