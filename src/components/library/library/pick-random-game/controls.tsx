import { FC } from "react";
import type { PickerControlsProps } from "@/src/types/library/components";
import { Button } from "@/src/shared/ui/button";

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

export { PickerControls };
