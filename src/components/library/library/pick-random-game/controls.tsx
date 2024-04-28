import type { PickerControlsProps } from "@/src/types/library/components";

import { Button } from "@/src/components/ui/button";
import { FC, memo } from "react";

const PickerControls: FC<PickerControlsProps> = ({
  hasChoice,
  isRunning,
  start,
  stop,
}) => (
  <div className="mt-4 flex gap-4">
    <Button disabled={isRunning || !hasChoice} onClick={start}>
      Start
    </Button>
    <Button disabled={!isRunning} onClick={stop} variant="secondary">
      Stop
    </Button>
  </div>
);

const MemoizedControls = memo(PickerControls);

MemoizedControls.displayName = "PickerControls";

export { MemoizedControls };
