import { Library } from "lucide-react";

import { EmptyState } from "@/shared/components/ui/empty-state";
import { LibraryItemStatus } from "@/shared/types/library";

const EMPTY_STATE_BY_STATUS: Record<
  string,
  {
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
  }
> = {
  [LibraryItemStatus.PLAYING]: {
    title: "No games in progress",
    description: "Start playing a game from your library.",
    actionLabel: "View Library",
    actionHref: "/library",
  },
  [LibraryItemStatus.UP_NEXT]: {
    title: "Nothing queued up",
    description: "Add games you plan to play next.",
    actionLabel: "Browse Games",
    actionHref: "/games/search",
  },
  [LibraryItemStatus.SHELF]: {
    title: "Nothing on hold",
    description: "Move games here when you take a break from them.",
    actionLabel: "View Library",
    actionHref: "/library",
  },
  [LibraryItemStatus.PLAYED]: {
    title: "No completed games yet",
    description: "Mark a game as played when you finish it.",
    actionLabel: "View Library",
    actionHref: "/library",
  },
  [LibraryItemStatus.WISHLIST]: {
    title: "Your wishlist is empty",
    description: "Search for games you want to play someday.",
    actionLabel: "Browse Games",
    actionHref: "/games/search",
  },
};

const DEFAULT_EMPTY_STATE = {
  title: "Your Library is Empty",
  description:
    "Start building your gaming library by searching for games and adding them.",
  actionLabel: "Browse Games",
  actionHref: "/games/search",
};

interface LibraryEmptyStateProps {
  status?: LibraryItemStatus;
}

export function LibraryEmptyState({ status }: LibraryEmptyStateProps) {
  const config = status ? EMPTY_STATE_BY_STATUS[status] : DEFAULT_EMPTY_STATE;
  const { title, description, actionLabel, actionHref } =
    config ?? DEFAULT_EMPTY_STATE;

  return (
    <EmptyState
      icon={Library}
      iconProps={{ size: "lg", variant: "default" }}
      title={title}
      description={description}
      action={{
        label: actionLabel,
        href: actionHref,
      }}
      spacing="spacious"
    />
  );
}
