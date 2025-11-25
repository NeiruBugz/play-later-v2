"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/ui/utils";

import type { UseLibraryModalReturn } from "../hooks/use-library-modal";
import { EntryForm } from "./entry-form";
import { EntryList } from "./entry-list";

interface DesktopLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  igdbId: number;
  gameTitle: string;
  modalState: UseLibraryModalReturn;
  onDeleteItem?: (itemId: number) => void;
}

export function DesktopLayout({
  isOpen,
  onClose,
  igdbId,
  gameTitle,
  modalState,
  onDeleteItem,
}: DesktopLayoutProps) {
  const {
    state,
    selectedEntry,
    selectEntry,
    startAddNew,
    cancelAddNew,
    onEntryAdded,
    onEntryUpdated,
    onEntryDeleted,
    existingPlatforms,
    entries,
  } = modalState;

  const isAddMode = state.view === "add";
  const isManageMode = state.view === "manage";

  const handleSuccess = () => {
    if (state.isAddingNew) {
      onEntryAdded();
    } else {
      onEntryUpdated();
    }
    onClose();
  };

  const handleDelete = (id: number) => {
    onDeleteItem?.(id);
    onEntryDeleted(id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0",
          isAddMode ? "max-w-[480px]" : "max-w-[800px]"
        )}
      >
        <DialogHeader className="border-b border-border px-2xl pb-lg pt-2xl">
          <DialogTitle>
            {isAddMode ? "Add to Library" : "Manage Library"}
          </DialogTitle>
          <DialogDescription className="truncate">
            {gameTitle}
          </DialogDescription>
        </DialogHeader>

        {isAddMode ? (
          <div className="p-2xl">
            <EntryForm
              igdbId={igdbId}
              gameTitle={gameTitle}
              entry={null}
              isAddMode={true}
              existingPlatforms={existingPlatforms}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </div>
        ) : isManageMode ? (
          <div className="flex min-h-[400px]">
            <EntryList
              entries={entries}
              selectedId={state.selectedEntryId}
              onSelect={selectEntry}
              onAddNew={startAddNew}
              isAddingNew={state.isAddingNew}
              className="w-[240px] shrink-0"
            />

            <div className="flex-1 overflow-y-auto p-2xl">
              {state.isAddingNew ? (
                <EntryForm
                  igdbId={igdbId}
                  gameTitle={gameTitle}
                  entry={null}
                  isAddMode={true}
                  existingPlatforms={existingPlatforms}
                  onSuccess={handleSuccess}
                  onCancel={cancelAddNew}
                />
              ) : selectedEntry ? (
                <EntryForm
                  key={selectedEntry.id}
                  igdbId={igdbId}
                  gameTitle={gameTitle}
                  entry={selectedEntry}
                  isAddMode={false}
                  existingPlatforms={existingPlatforms}
                  onSuccess={handleSuccess}
                  onDelete={handleDelete}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    Select an entry to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
