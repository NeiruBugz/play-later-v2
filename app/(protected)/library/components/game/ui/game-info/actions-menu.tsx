"use client";

import { deleteGame } from "@/app/(protected)/library/lib/actions/delete-game";
import { updateStatus } from "@/app/(protected)/library/lib/actions/update-game";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Game, GameStatus } from "@prisma/client";
import {
  CheckCheck,
  EllipsisVertical,
  Ghost,
  Library,
  ListChecks,
  Play,
  Trash2Icon,
} from "lucide-react";
import { MouseEvent } from "react";
import { IconContext } from "react-icons";
import { BsBookshelf } from "react-icons/bs";

export const ActionsMenu = ({
  gameId,
  status,
}: {
  gameId: Game["id"];
  status: GameStatus | null;
}) => {
  const onStatusChange = async (event: MouseEvent<HTMLDivElement>) => {
    const status = event.currentTarget.dataset.status;

    if (!status) {
      throw new Error("No status found");
    }

    try {
      await updateStatus(gameId, status as GameStatus);
    } catch (error) {
      console.log(error);
    }
  };

  const onDeleteClick = async () => {
    try {
      await deleteGame(gameId);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="self-end" size="icon" variant="ghost">
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-status="BACKLOG"
          disabled={status === "BACKLOG"}
          onClick={onStatusChange}
        >
          <Library className="mr-2 md:size-4" /> Move to backlog
        </DropdownMenuItem>
        <DropdownMenuItem
          data-status="INPROGRESS"
          disabled={status === "INPROGRESS"}
          onClick={onStatusChange}
        >
          <Play className="mr-2 md:size-4" />
          Start playing
        </DropdownMenuItem>
        <DropdownMenuItem
          data-status="COMPLETED"
          disabled={status === "COMPLETED"}
          onClick={onStatusChange}
        >
          <ListChecks className="mr-2 md:size-4" />
          Mark as completed
        </DropdownMenuItem>
        <DropdownMenuItem
          data-status="FULL_COMPLETION"
          disabled={status === "FULL_COMPLETION"}
          onClick={onStatusChange}
        >
          <CheckCheck className="mr-2 md:size-4" />
          Mark as 100% completed
        </DropdownMenuItem>
        <DropdownMenuItem
          data-status="ABANDONED"
          disabled={status === "ABANDONED"}
          onClick={onStatusChange}
        >
          <Ghost className="mr-2 md:size-4" />
          Abandon
        </DropdownMenuItem>
        <DropdownMenuItem
          data-status="SHELVED"
          disabled={status === "SHELVED"}
          onClick={onStatusChange}
        >
          <IconContext.Provider value={{ size: "24" }}>
            <BsBookshelf className="mr-2 md:size-4" />
          </IconContext.Provider>
          Shelve
        </DropdownMenuItem>
        <DropdownMenuLabel>Danger zone</DropdownMenuLabel>
        <DropdownMenuItem
          className="text-destructive hover:bg-destructive/90"
          onClick={onDeleteClick}
        >
          <Trash2Icon className="mr-2 md:size-4" />
          Delete game
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
