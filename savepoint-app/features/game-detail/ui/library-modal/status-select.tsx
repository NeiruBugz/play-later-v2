"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import { STATUS_OPTIONS } from "./constants";

type StatusSelectProps<T extends FieldValues = FieldValues> = {
  field: ControllerRenderProps<T, FieldPath<T>>;
  description?: string;
  className?: string;
};

export const StatusSelect = <T extends FieldValues = FieldValues>({
  field,
  description = "Select your current journey status with this game",
  className,
}: StatusSelectProps<T>) => {
  return (
    <FormItem>
      <FormLabel>Journey Status</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger className={className}>
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col py-1">
                <span>{option.label}</span>
                <span className="text-muted-foreground text-xs">
                  {option.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription>{description}</FormDescription>
      <FormMessage />
    </FormItem>
  );
};
