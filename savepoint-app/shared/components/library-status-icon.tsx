import { Archive, Bookmark, CheckCircle, Gamepad2, Star } from "lucide-react";

import { LibraryItemStatus } from "@/shared/types/library";

type Props = {
  status: LibraryItemStatus;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
  "data-testid"?: string;
};

export function LibraryStatusIcon({ status, ...props }: Props) {
  switch (status) {
    case LibraryItemStatus.UP_NEXT:
      return <Star {...props} />;
    case LibraryItemStatus.PLAYING:
      return <Gamepad2 {...props} />;
    case LibraryItemStatus.SHELF:
      return <Archive {...props} />;
    case LibraryItemStatus.PLAYED:
      return <CheckCircle {...props} />;
    case LibraryItemStatus.WISHLIST:
      return <Bookmark {...props} />;
    default:
      return null;
  }
}
