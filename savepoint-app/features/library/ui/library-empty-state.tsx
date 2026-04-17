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
    title: "Nothing in progress",
    description: "When you start playing something, it lives here.",
    actionLabel: "Go to shelf",
    actionHref: "/library?status=SHELF",
  },
  [LibraryItemStatus.UP_NEXT]: {
    title: "Your queue is empty",
    description: "Queue a game from the shelf for when you're ready.",
    actionLabel: "Browse the shelf",
    actionHref: "/library?status=SHELF",
  },
  [LibraryItemStatus.SHELF]: {
    title: "Your shelf is empty",
    description: "Add games you own — digital or physical — to your shelf.",
    actionLabel: "Find a game",
    actionHref: "/games/search",
  },
  [LibraryItemStatus.PLAYED]: {
    title: "Nothing set down yet",
    description: "Games you've finished — or set aside for now — show up here.",
    actionLabel: "Browse the shelf",
    actionHref: "/library?status=SHELF",
  },
  [LibraryItemStatus.WISHLIST]: {
    title: "Your wishlist is empty",
    description: "Games you want someday, without pressure to buy them yet.",
    actionLabel: "Find a game",
    actionHref: "/games/search",
  },
};

const DEFAULT_EMPTY_STATE = {
  title: "Your library is empty",
  description: "Start your shelf — add a game you already own.",
  actionLabel: "Find a game",
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
