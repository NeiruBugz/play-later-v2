"use client";

import type { OnboardingProgress } from "@/data-access-layer/services";
import { ChevronDown, X } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { cn } from "@/shared/lib/ui/utils";

import { dismissOnboarding } from "../server-actions";
import { OnboardingStep } from "./onboarding-step";

interface GettingStartedProps {
  progress: OnboardingProgress;
}

export function GettingStarted({ progress }: GettingStartedProps) {
  const [isPending, startTransition] = useTransition();
  const progressPercentage = Math.round(
    (progress.completedCount / progress.totalCount) * 100
  );
  const isNearComplete = progressPercentage >= 80;
  const [isExpanded, setIsExpanded] = useState(!isNearComplete);

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissOnboarding({});
    });
  };

  return (
    <Card variant="outlined" className="animate-fade-in">
      <CardHeader
        spacing="comfortable"
        className="flex-row items-center justify-between"
      >
        <div className="flex-1">
          <CardTitle className="heading-sm">Getting Started</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          disabled={isPending}
          aria-label="Dismiss getting started"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent spacing="comfortable" className="space-y-lg">
        <div className="space-y-sm">
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className={cn(
                "bg-primary ease-out-expo h-full transition-all duration-500"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex items-center justify-between">
            <p className="body-xs text-muted-foreground">
              {isNearComplete && !isExpanded
                ? `Almost done! ${progress.completedCount} of ${progress.totalCount} complete`
                : `${progress.completedCount} of ${progress.totalCount} complete`}
            </p>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="divide-border divide-y">
              {progress.steps.map((step, index) => (
                <OnboardingStep key={step.id} step={step} index={index} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
