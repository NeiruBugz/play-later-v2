"use client";

import { X } from "lucide-react";
import { Drawer } from "vaul";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";

import type { UseLibraryModalReturn } from "../hooks/use-library-modal";
import { EntryForm } from "./entry-form";
import { EntryTabs } from "./entry-tabs";

interface MobileLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  igdbId: number;
  gameTitle: string;
  modalState: UseLibraryModalReturn;
  onDeleteItem?: (itemId: number) => void;
}

export function MobileLayout({
  isOpen,
  onClose,
  igdbId,
  gameTitle,
  modalState,
  onDeleteItem,
}: MobileLayoutProps) {
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
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content
          className={cn(
            "bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[96%] flex-col rounded-t-xl"
          )}
        >
          <div className="mt-lg bg-muted mx-auto h-1.5 w-12 shrink-0 rounded-full" />

          <div className="border-border px-lg pb-md pt-sm sm:px-xl sm:pb-lg sm:pt-md flex items-center justify-between border-b">
            <div className="min-w-0 flex-1">
              <Drawer.Title className="text-base font-semibold sm:text-lg">
                {isAddMode ? "Add to Library" : "Manage Library"}
              </Drawer.Title>
              <Drawer.Description className="text-muted-foreground truncate text-xs sm:text-sm">
                {gameTitle}
              </Drawer.Description>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 shrink-0 sm:h-10 sm:w-10"
              aria-label="Close"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {isManageMode && entries.length > 0 && (
            <EntryTabs
              entries={entries}
              selectedId={state.selectedEntryId}
              onSelect={selectEntry}
              onAddNew={startAddNew}
              isAddingNew={state.isAddingNew}
            />
          )}

          <div className="p-lg sm:p-xl flex-1 overflow-y-auto">
            {isAddMode ? (
              <EntryForm
                igdbId={igdbId}
                gameTitle={gameTitle}
                entry={null}
                isAddMode={true}
                existingPlatforms={existingPlatforms}
                onSuccess={handleSuccess}
                onCancel={onClose}
              />
            ) : state.isAddingNew ? (
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
