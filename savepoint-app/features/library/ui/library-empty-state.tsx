import { Library } from "lucide-react";

import { EmptyState } from "@/shared/components/ui/empty-state";

export function LibraryEmptyState() {
  return (
    <EmptyState
      icon={Library}
      iconProps={{ size: "lg", variant: "default" }}
      title="Your Library is Empty"
      description="Start building your gaming library by searching for games and adding them."
      action={{
        label: "Browse Games",
        href: "/games/search",
      }}
      spacing="spacious"
    />
  );
}
