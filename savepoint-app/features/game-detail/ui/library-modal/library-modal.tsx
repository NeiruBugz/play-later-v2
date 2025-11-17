"use client";
import type { LibraryItem } from "@prisma/client";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { AddEntryForm } from "./add-entry-form";
import { EditEntryForm } from "./edit-entry-form";
import { LibraryItemCard } from "./library-item-card";
type LibraryModalProps = {
  gameId?: string;
  isOpen: boolean;
  onClose: () => void;
  igdbId: number;
  gameTitle: string;
  mode: "add" | "edit";
  existingItems?: LibraryItem[];
  onDeleteItem?: (itemId: number) => void;
};
export const LibraryModal = ({
  gameId,
  isOpen,
  onClose,
  igdbId,
  gameTitle,
  mode,
  existingItems = [],
  onDeleteItem,
}: LibraryModalProps) => {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSelectedItemId(null);
      setActiveTab("");
    }
  }, [isOpen]);
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
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]"
        aria-describedby="library-modal-description"
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add to Library" : "Manage Library"}
          </DialogTitle>
          <DialogDescription id="library-modal-description">
            {mode === "add"
              ? `Add ${gameTitle} to your library and set your journey status.`
              : `Update your library entries for ${gameTitle}.`}
          </DialogDescription>
        </DialogHeader>
        {mode === "add" ? (
          <AddEntryForm
            gameId={gameId}
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
            ) : selectedItemId !== null ? (
              // Edit mode for a specific item
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Edit Entry</h3>
                  <Button
                    onClick={() => setSelectedItemId(null)}
                    className="text-muted-foreground hover:text-foreground text-xs underline"
                    aria-label="Back to list view"
                  >
                    ← Back to all entries
                  </Button>
                </div>
                <EditEntryForm
                  item={
                    existingItems.find((item) => item.id === selectedItemId)!
                  }
                  onSuccess={handleSuccess}
                  onCancel={handleClose}
                />
              </div>
            ) : (
              // List view of all library items
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">
                    Your Library Entries ({existingItems.length})
                  </h3>
                </div>
                {}
                <div className="max-h-[400px] space-y-3 overflow-y-auto">
                  {existingItems.map((item) => (
                    <LibraryItemCard
                      key={item.id}
                      item={item}
                      onClick={() => handleItemSelect(item.id)}
                      onDelete={onDeleteItem}
                    />
                  ))}
                </div>
                {}
                <button
                  onClick={() => setActiveTab("add-new")}
                  className="border-primary text-primary hover:bg-primary/5 flex w-full items-center justify-center gap-2 rounded-md border border-dashed py-3 text-sm font-medium transition-colors"
                  aria-label="Add new library entry"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add New Entry
                </button>
              </div>
            )}
            {}
            {activeTab === "add-new" && selectedItemId === null && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Add New Entry</h3>
                  <button
                    onClick={() => setActiveTab("")}
                    className="text-muted-foreground hover:text-foreground text-xs underline"
                    aria-label="Back to list view"
                  >
                    ← Back to all entries
                  </button>
                </div>
                <AddEntryForm
                  igdbId={igdbId}
                  gameTitle={gameTitle}
                  isEditMode
                  onSuccess={handleSuccess}
                  onCancel={handleClose}
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
