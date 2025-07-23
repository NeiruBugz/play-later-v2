"use client";

import {
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { cn } from "@/shared/lib";

const radioGroupContainerStyles =
  "inline-flex h-10 w-fit items-center justify-center rounded-md bg-muted p-1 text-muted-foreground";

const radioGroupLabelStyles = cn(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
  "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
);

type RadioGroupFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  description: string;
  options: string[];
  mapper: Record<string, string>;
  disabled?: boolean;
};

export function RadioGroupField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  description,
  options,
  mapper,
  disabled = false,
}: RadioGroupFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel className="text-base font-medium">{label}</FormLabel>
          <p className="text-sm text-muted-foreground">{description}</p>
          <FormControl id={field.name}>
            <RadioGroup
              id={field.name}
              name={field.name}
              onValueChange={field.onChange}
              value={field.value}
              className={radioGroupContainerStyles}
              disabled={disabled}
            >
              {options.map((key) => (
                <FormItem key={key}>
                  <FormControl>
                    <RadioGroupItem
                      className="sr-only"
                      value={key}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormLabel
                    className={cn(radioGroupLabelStyles, {
                      "bg-background text-foreground shadow-sm":
                        field.value === key,
                      "opacity-50": disabled,
                    })}
                  >
                    {mapper[key]}
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
