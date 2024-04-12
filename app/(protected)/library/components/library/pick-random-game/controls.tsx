import { FC, memo } from "react";

import { Button } from "@/components/ui/button";

import type { PickerControlsProps } from "@/app/(protected)/library/lib/types/components";

const PickerControls: FC<PickerControlsProps> = ({
  isRunning,
  hasChoice,
  start,
  stop,
}) => (
  <div className="mt-4 flex gap-4">
    <Button onClick={start} disabled={isRunning || !hasChoice}>
      Start
    </Button>
    <Button onClick={stop} disabled={!isRunning} variant="secondary">
      Stop
    </Button>
  </div>
);

const MemoizedControls = memo(PickerControls);

MemoizedControls.displayName = "PickerControls";

export { MemoizedControls };
