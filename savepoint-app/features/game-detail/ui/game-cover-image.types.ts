import type { LibraryItemStatus } from "@/shared/types";

export interface GameCoverImageProps {
  imageId?: string | null;
  gameTitle: string;
  className?: string;
  libraryStatus?: LibraryItemStatus | null;
}
