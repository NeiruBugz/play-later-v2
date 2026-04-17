"use client";

import { Pencil, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";

import { GameCoverImage } from "@/shared/components/game-cover-image";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { cn } from "@/shared/lib/ui/utils";

import { getPlayingGameAction } from "../server-actions/get-playing-game";
import { GameSelector } from "./game-selector";
import { JournalEntryQuickForm } from "./journal-entry-quick-form";

interface SelectedGame {
  id: string;
  title: string;
  coverImage: string | null;
}

interface JournalQuickEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * When provided, the sheet opens pre-filled with this game and skips the
   * auto-fetch of the currently-playing game. Useful when opening from a
   * specific dashboard tile or game detail page.
   */
  preselectedGame?: SelectedGame;
}

function SelectedGameHeader({
  game,
  onChangeGame,
}: {
  game: SelectedGame;
  onChangeGame: () => void;
}) {
  return (
    <div className="bg-muted/50 p-sm mb-lg gap-md flex items-center rounded-lg">
      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md shadow-sm">
        <GameCoverImage
          imageId={game.coverImage}
          gameTitle={game.title}
          size="cover_small"
          className="h-full w-full"
          imageClassName="rounded-md object-cover"
          sizes="40px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">Writing about</p>
        <p className="truncate font-medium">{game.title}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onChangeGame}
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        <Pencil className="mr-1 h-3 w-3" />
        Change
      </Button>
    </div>
  );
}

export function JournalQuickEntrySheet({
  isOpen,
  onClose,
  preselectedGame,
}: JournalQuickEntrySheetProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [selectedGame, setSelectedGame] = useState<SelectedGame | null>(
    preselectedGame ?? null
  );
  const [isLoadingGame, setIsLoadingGame] = useState(false);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (isOpen && !selectedGame && !preselectedGame) {
      let isCancelled = false;
      Promise.resolve()
        .then(() => {
          if (isCancelled) return;
          setIsLoadingGame(true);
          return getPlayingGameAction();
        })
        .then((result) => {
          if (isCancelled || !result) return;
          if (result.success && result.data) {
            setSelectedGame({
              id: result.data.id,
              title: result.data.title,
              coverImage: result.data.coverImage,
            });
          }
        })
        .catch((error) => {
          if (!isCancelled) {
            console.error("Failed to fetch playing game:", error);
          }
        })
        .finally(() => {
          if (!isCancelled) {
            setIsLoadingGame(false);
          }
        });

      return () => {
        isCancelled = true;
      };
    }
  }, [isOpen, selectedGame, preselectedGame]);

  const handleGameSelect = (
    gameId: string,
    gameTitle: string,
    coverImage: string | null
  ) => {
    setSelectedGame({
      id: gameId,
      title: gameTitle,
      coverImage: coverImage,
    });
    setShowGameSelector(false);
  };

  const handleChangeGame = () => {
    setShowGameSelector(true);
  };

  const handleBackFromSelector = () => {
    setShowGameSelector(false);
  };

  const handleSuccess = () => {
    isDirtyRef.current = false;
    onClose();
    setSelectedGame(null);
    setShowGameSelector(false);
  };

  const forceClose = useCallback(() => {
    isDirtyRef.current = false;
    setShowDiscardConfirm(false);
    onClose();
    setTimeout(() => {
      setSelectedGame(null);
      setShowGameSelector(false);
    }, 200);
  }, [onClose]);

  const handleClose = useCallback(() => {
    if (isDirtyRef.current) {
      setShowDiscardConfirm(true);
      return;
    }
    forceClose();
  }, [forceClose]);

  const handleDirtyChange = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty;
  }, []);

  const renderContent = () => {
    if (isLoadingGame) {
      return (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      );
    }

    if (showGameSelector || !selectedGame) {
      return (
        <GameSelector
          onGameSelect={handleGameSelect}
          onCancel={selectedGame ? handleBackFromSelector : handleClose}
        />
      );
    }

    return (
      <>
        <SelectedGameHeader
          game={selectedGame}
          onChangeGame={handleChangeGame}
        />
        <JournalEntryQuickForm
          gameId={selectedGame.id}
          onSuccess={handleSuccess}
          onCancel={handleClose}
          onDirtyChange={handleDirtyChange}
        />
      </>
    );
  };

  const discardConfirmOverlay = showDiscardConfirm && (
    <div className="bg-background/95 gap-lg p-lg absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
      <p className="text-center font-medium">Discard unsaved entry?</p>
      <p className="text-muted-foreground text-center text-sm">
        Your journal entry hasn&apos;t been saved yet.
      </p>
      <div className="gap-md flex">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDiscardConfirm(false)}
        >
          Keep editing
        </Button>
        <Button variant="destructive" size="sm" onClick={forceClose}>
          Discard
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer.Root
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Drawer.Content
            className={cn(
              "bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85vh] flex-col rounded-t-xl"
            )}
          >
            <div className="mt-lg bg-muted mx-auto h-1.5 w-12 shrink-0 rounded-full" />

            <div className="border-border/50 px-lg pb-md pt-sm flex items-center justify-between border-b">
              <div className="min-w-0 flex-1">
                <Drawer.Title className="text-lg font-semibold">
                  Quick Journal Entry
                </Drawer.Title>
                <Drawer.Description className="text-muted-foreground/80 text-sm">
                  Capture your gaming moment
                </Drawer.Description>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-10 w-10 shrink-0"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-lg relative flex-1 overflow-y-auto">
              {renderContent()}
              {discardConfirmOverlay}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="relative sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Quick Journal Entry
          </DialogTitle>
          <DialogDescription>Capture your gaming moment</DialogDescription>
        </DialogHeader>

        {renderContent()}
        {discardConfirmOverlay}
      </DialogContent>
    </Dialog>
  );
}
