"use client";

import { format, parseISO } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/ui/utils";

interface DateFieldsCollapsibleProps {
  startedValue: Date | undefined;
  completedValue: Date | undefined;
  onStartedChange: (date: Date | undefined) => void;
  onCompletedChange: (date: Date | undefined) => void;
  defaultExpanded?: boolean;
}

function formatDateForInput(date: Date | undefined): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}

function parseDateFromInput(value: string): Date | undefined {
  if (!value) return undefined;
  try {
    return parseISO(value);
  } catch {
    return undefined;
  }
}

export function DateFieldsCollapsible({
  startedValue,
  completedValue,
  onStartedChange,
  onCompletedChange,
  defaultExpanded,
}: DateFieldsCollapsibleProps) {
  const hasValues = !!(startedValue || completedValue);
  const [isOpen, setIsOpen] = useState(defaultExpanded ?? hasValues);

  const triggerLabel = isOpen
    ? "Hide dates"
    : hasValues
      ? "Edit dates"
      : "Add dates";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        type="button"
        className={cn(
          "flex items-center gap-sm text-sm",
          "text-muted-foreground hover:text-foreground",
          "transition-colors duration-fast"
        )}
        aria-expanded={isOpen}
      >
        <Calendar className="h-4 w-4" aria-hidden />
        <span>{triggerLabel}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-fast",
            isOpen && "rotate-180"
          )}
          aria-hidden
        />
      </CollapsibleTrigger>

      <CollapsibleContent
        className={cn(
          "overflow-hidden",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2"
        )}
      >
        <div className="grid grid-cols-2 gap-xl pt-lg">
          <div className="space-y-sm">
            <Label htmlFor="started-date" className="text-muted-foreground text-xs">
              Started
            </Label>
            <Input
              id="started-date"
              type="date"
              value={formatDateForInput(startedValue)}
              onChange={(e) => onStartedChange(parseDateFromInput(e.target.value))}
              className="text-sm"
            />
          </div>
          <div className="space-y-sm">
            <Label htmlFor="completed-date" className="text-muted-foreground text-xs">
              Completed
            </Label>
            <Input
              id="completed-date"
              type="date"
              value={formatDateForInput(completedValue)}
              onChange={(e) => onCompletedChange(parseDateFromInput(e.target.value))}
              className="text-sm"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
