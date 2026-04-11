"use client";

import { format } from "date-fns";
import type { FieldValues } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";

import type { DateFieldProps } from "./date-field.types";

const isDateValue = (value: unknown): value is Date => {
  return value instanceof Date && !Number.isNaN(value.getTime());
};

const parseLocalDate = (dateValue: string): Date | undefined => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return undefined;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const DateField = <T extends FieldValues = FieldValues>({
  field,
  label,
  description,
}: DateFieldProps<T>) => {
  const { value, onChange, onBlur, name, ref } = field;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    onChange(dateValue ? parseLocalDate(dateValue) : undefined);
  };

  const inputValue = isDateValue(value) ? format(value, "yyyy-MM-dd") : "";

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Input
          type="date"
          value={inputValue}
          onChange={handleChange}
          onBlur={onBlur}
          name={name}
          ref={ref}
        />
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};
