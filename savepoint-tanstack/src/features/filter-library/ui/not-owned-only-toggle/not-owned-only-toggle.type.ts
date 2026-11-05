import type { LibraryStatus } from "@/features/filter-library/lib";

export type NotOwnedOnlyToggleProps = {
  status: LibraryStatus | undefined;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
};
