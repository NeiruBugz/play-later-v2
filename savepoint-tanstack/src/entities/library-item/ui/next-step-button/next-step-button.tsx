import { Button } from "@/shared/ui/button";

import { NEXT_STEP } from "../../model";
import type { NextStepButtonProps } from "./next-step-button.type";

/** One-tap lifecycle advance: Want -> Playing -> Done -> Playing again. */
export function NextStepButton({
  status,
  onStep,
  size = "sm",
  disabled = false,
  className,
}: NextStepButtonProps) {
  const { label, target } = NEXT_STEP[status];

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      disabled={disabled}
      className={className}
      onClick={() => onStep(target)}
    >
      {label}
    </Button>
  );
}
