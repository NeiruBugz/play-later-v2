import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

import { formatAbsoluteDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/utils";

import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type DatePickerProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  ariaLabel: string;
  id?: string;
  placeholder?: string;
};

function DatePicker({
  value,
  onChange,
  ariaLabel,
  id,
  placeholder = "Pick a date",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={ariaLabel}
          className={cn(
            "gap-md justify-start text-left font-normal",
            value === null && "text-muted-foreground"
          )}
        >
          <CalendarIcon aria-hidden="true" />
          {value === null
            ? placeholder
            : formatAbsoluteDate(value, { utc: true })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(date) => {
            onChange(date ?? null);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
DatePicker.displayName = "DatePicker";

export { DatePicker };
