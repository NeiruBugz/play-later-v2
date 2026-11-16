import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { useMutationAction } from "@/shared/lib/use-mutation-action";
import { Button, buttonVariants } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";

import { startSteamSyncFn } from "../../api/start-steam-sync";
import {
  isSyncActive,
  STEAM_SYNC_STATUS_QUERY_KEY,
  useSteamSyncStatus,
} from "../steam-sync-status";
import type { SyncStartButtonProps } from "./sync-start-button.type";

export function SyncStartButton({ connected }: SyncStartButtonProps) {
  const queryClient = useQueryClient();
  const { data: syncStatus } = useSteamSyncStatus();
  const { pending, run } = useMutationAction();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [addAllToLibrary, setAddAllToLibrary] = useState(false);
  const [alreadyRunning, setAlreadyRunning] = useState(false);

  if (!connected) {
    return (
      <Link
        to="/settings/account"
        className={buttonVariants({ variant: "outline" })}
      >
        Connect Steam to sync
      </Link>
    );
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      setAddAllToLibrary(false);
      setAlreadyRunning(false);
    }
  };

  const handleStart = async () => {
    await run(() => startSteamSyncFn({ data: { addAllToLibrary } }), {
      errorFallback: "Could not start the sync",
      invalidate: false,
      onSuccess: (result) => {
        setIsDialogOpen(false);
        setAlreadyRunning(result.alreadyRunning);
        void queryClient.invalidateQueries({
          queryKey: STEAM_SYNC_STATUS_QUERY_KEY,
        });
      },
    });
  };

  const isSyncing = isSyncActive(syncStatus);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        disabled={isSyncing}
        onClick={() => handleDialogOpenChange(true)}
      >
        {isSyncing ? "Syncing…" : "Sync"}
      </Button>
      {alreadyRunning ? (
        <p className="text-xs text-muted-foreground">
          A sync is already running
        </p>
      ) : null}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync your Steam library</DialogTitle>
            <DialogDescription>
              We&apos;ll bring in your Steam games and look each one up. You can
              leave this page — we&apos;ll let you know when it&apos;s done.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Checkbox
              id="sync-add-all-to-library"
              checked={addAllToLibrary}
              onCheckedChange={(checked) =>
                setAddAllToLibrary(checked === true)
              }
            />
            <Label
              htmlFor="sync-add-all-to-library"
              className="cursor-pointer font-normal"
            >
              Also add all games to my library
            </Label>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="button" onClick={handleStart} disabled={pending}>
              Start sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
