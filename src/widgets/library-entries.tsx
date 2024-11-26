import { DeleteBacklogItem } from "@/src/features/delete-backlog-item";
import {
  AcquisitionStatusMapper,
  BacklogStatusMapper,
  cn,
  normalizeString,
  platformToBackgroundColor,
} from "@/src/shared/lib";
import { Badge } from "@/src/shared/ui/badge";
import type { BacklogItem } from "@prisma/client";

export function LibraryEntries({
  backlogItems,
}: {
  backlogItems: BacklogItem[];
}) {
  return (
    <div className="my-2">
      <h2>Your entries</h2>
      <ul>
        {backlogItems.map((backlogItem) => (
          <li key={backlogItem.id} className="my-1 flex items-center gap-2">
            <Badge>{BacklogStatusMapper[backlogItem.status]}</Badge> –{" "}
            <Badge
              className={cn(
                {},
                `${platformToBackgroundColor(backlogItem.platform ?? "")}`
              )}
            >
              {normalizeString(backlogItem.platform as string)}
            </Badge>{" "}
            –<span>{AcquisitionStatusMapper[backlogItem.acquisitionType]}</span>
            <DeleteBacklogItem backlogItemId={backlogItem.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
