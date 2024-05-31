import { FC } from "react";

import { Button } from "@/src/shared/ui/button";

import type { PickerControlsProps } from "./types";

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
