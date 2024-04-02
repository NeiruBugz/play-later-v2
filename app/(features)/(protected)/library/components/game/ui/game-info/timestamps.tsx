import { Game } from "@prisma/client";
import { differenceInDays, format } from "date-fns";

import { mapStatusForInfo } from "@/lib/utils";

export const Timestamps = ({
  createdAt,
  updatedAt,
  status,
}: {
  createdAt: Game["createdAt"];
  updatedAt: Game["updatedAt"];
  status: Game["status"];
}) => (
  <section>
    <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
      Time logs
    </h3>
    <div className="flex gap-2">
      <div>
        <p className="text-xs font-medium">Added at</p>
        <p className="text-xs leading-none text-foreground">
          {createdAt ? format(createdAt, "dd MMM, yyyy") : "-"}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium">Last updated</p>
        <p className="text-xs leading-none text-foreground">
          {updatedAt ? format(updatedAt, "dd MMM, yyyy") : "-"}
        </p>
      </div>
      <div>
        {differenceInDays(updatedAt, createdAt) >= 1 && status ? (
          <p className="text-xs text-foreground">
            How long in {mapStatusForInfo(status)}:{" "}
            {differenceInDays(updatedAt, createdAt)} days
          </p>
        ) : null}
      </div>
    </div>
  </section>
);
