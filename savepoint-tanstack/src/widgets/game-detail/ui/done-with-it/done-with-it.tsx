import { useState } from "react";

import { Button } from "@/shared/ui/button";

import type { DoneOutcome } from "../../../../../shared/lib/prisma/client.ts";
import type { DoneWithItProps } from "./done-with-it.type";

export function DoneWithIt({ libraryStatus }: DoneWithItProps) {
  const [choosingReason, setChoosingReason] = useState(false);

  const finishWith = (doneOutcome: DoneOutcome) => {
    setChoosingReason(false);
    void libraryStatus.setStatus("DONE", { doneOutcome });
  };

  if (!choosingReason) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-11"
        disabled={libraryStatus.isPending}
        onClick={() => setChoosingReason(true)}
      >
        Done with it?
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => finishWith("FINISHED")}
        >
          Finished
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => finishWith("LET_GO")}
        >
          Let it go
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          onClick={() => setChoosingReason(false)}
        >
          Not yet
        </Button>
      </div>
      <p className="text-xs text-[var(--tint-ink)]">
        Both move it to Done. Only you see which one.
      </p>
    </div>
  );
}
