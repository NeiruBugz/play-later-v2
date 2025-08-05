"use client";

import { type Control } from "react-hook-form";

import {
  FormControl,
  FormField,
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
import { playingOnPlatforms } from "@/shared/lib";

import { type CreateGameActionInput } from "../lib/validation";

type PlatformSelectorProps = {
  control: Control<CreateGameActionInput>;
  disabled?: boolean;
};

export function PlatformSelector({
  control,
  disabled = false,
}: PlatformSelectorProps) {
  return (
    <FormField
      control={control}
      name="platform"
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={field.name} className="text-base font-medium">
            Platform of choice
          </FormLabel>
          <p className="mb-3 text-sm text-muted-foreground">
            Which platform are you planning to play this game on?
          </p>
          <Select
            name={field.name}
            onValueChange={field.onChange}
            value={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger id={field.name} className="h-11">
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {playingOnPlatforms.map((platform) => (
                <SelectItem value={platform.value} key={platform.value}>
                  {platform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
