import { ListPlus, ListX } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { DropdownMenuItem } from "@/shared/ui/dropdown-menu";

import type { UpNextMenuActionsProps } from "./up-next-menu-actions.type";

const PUT_LABEL = "Put in Up Next";
const REMOVE_LABEL = "Remove from Up Next";

export function UpNextMenuActions({
  status,
  membership,
  variant = "menu",
}: UpNextMenuActionsProps) {
  if (status === "PLAYING") return null;

  const { isQueued, isPending, put, remove } = membership;
  const label = isQueued ? REMOVE_LABEL : PUT_LABEL;
  const Icon = isQueued ? ListX : ListPlus;
  const run = () => void (isQueued ? remove() : put());

  if (variant === "button") {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={run}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
    );
  }

  return (
    <DropdownMenuItem disabled={isPending} onSelect={run}>
      <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
      {label}
    </DropdownMenuItem>
  );
}
