import type { OnboardingStep as OnboardingStepType } from "@/data-access-layer/services";
import { Check, Circle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui";

interface OnboardingStepProps {
  step: OnboardingStepType;
  index: number;
}

export function OnboardingStep({ step, index }: OnboardingStepProps) {
  return (
    <div
      className={cn(
        "gap-lg py-md flex items-start",
        "animate-fade-in",
        step.isComplete && "opacity-60"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
          step.isComplete
            ? "bg-primary text-primary-foreground"
            : "border-border border"
        )}
      >
        {step.isComplete ? (
          <Check className="h-3 w-3" />
        ) : (
          <Circle className="text-muted-foreground/50 h-2 w-2" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "body-sm font-medium",
            step.isComplete && "line-through"
          )}
        >
          {step.title}
        </p>
        <p className="body-xs text-muted-foreground">{step.description}</p>
      </div>

      {!step.isComplete && step.actionUrl && step.actionLabel && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={step.actionUrl}>{step.actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
