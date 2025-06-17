"use client";

import { Button } from "@/shared/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/dropdown-menu";
import {
  BookMarked,
  Check,
  ChevronDown,
  Clock,
  Heart,
  Plus,
  Trophy,
} from "lucide-react";
import { useState } from "react";

type GameStatus = "backlog" | "playing" | "completed" | "wishlist" | "none";

interface GameStatusSelectorProps {
  gameId: string;
  initialStatus?: GameStatus;
}

export function GameStatusSelector({
  gameId,
  initialStatus = "none",
}: GameStatusSelectorProps) {
  const [status, setStatus] = useState<GameStatus>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusConfig = {
    backlog: {
      label: "In Backlog",
      icon: BookMarked,
      color: "bg-green-500",
      variant: "default" as const,
    },
    playing: {
      label: "Playing",
      icon: Clock,
      color: "bg-blue-500",
      variant: "default" as const,
    },
    completed: {
      label: "Completed",
      icon: Trophy,
      color: "bg-purple-500",
      variant: "default" as const,
    },
    wishlist: {
      label: "In Wishlist",
      icon: Heart,
      color: "bg-red-500",
      variant: "default" as const,
    },
    none: {
      label: "Add to...",
      icon: Plus,
      color: "",
      variant: "outline" as const,
    },
  };

  const handleStatusChange = async (newStatus: GameStatus) => {
    if (newStatus === status) return;

    setIsUpdating(true);
    try {
      setStatus(newStatus);
    } catch (error) {
      console.error("Failed to update game status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatus = statusConfig[status];
  const Icon = currentStatus.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={currentStatus.variant}
          className="w-full justify-between"
          disabled={isUpdating}
        >
          <div className="flex items-center gap-2">
            <Icon size={16} />
            <span>{currentStatus.label}</span>
          </div>
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuItem onClick={() => handleStatusChange("backlog")}>
          <BookMarked className="mr-2 h-4 w-4" />
          <span>Add to Backlog</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("playing")}>
          <Clock className="mr-2 h-4 w-4" />
          <span>Playing</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
          <Check className="mr-2 h-4 w-4" />
          <span>Completed</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("wishlist")}>
          <Heart className="mr-2 h-4 w-4" />
          <span>Add to Wishlist</span>
        </DropdownMenuItem>
        {status !== "none" && (
          <DropdownMenuItem
            onClick={() => handleStatusChange("none")}
            className="text-destructive"
          >
            <span>Remove from Lists</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
