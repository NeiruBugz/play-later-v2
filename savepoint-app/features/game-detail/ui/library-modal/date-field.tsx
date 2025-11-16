"use client";

import { format } from "date-fns";
import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";

type DateFieldProps<T extends FieldValues = FieldValues> = {
  field: ControllerRenderProps<T, FieldPath<T>>;
  label: string;
  description?: string;
};

export const DateField = <T extends FieldValues = FieldValues>({
  field,
  label,
  description,
}: DateFieldProps<T>) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      // Convert string to Date object
      field.onChange(new Date(dateValue));
    } else {
      // Clear the field if empty
      field.onChange(undefined);
    }
  };

  // Format Date object to yyyy-MM-dd string for input value
  // Type guard: check if value exists and is a Date instance
  const isDateValue = (value: unknown): value is Date => {
    return value !== null && value !== undefined && value instanceof Date;
  };

  const inputValue = isDateValue(field.value)
    ? format(field.value, "yyyy-MM-dd")
    : "";

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Input
          type="date"
          value={inputValue}
          onChange={handleChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
        />
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
};
