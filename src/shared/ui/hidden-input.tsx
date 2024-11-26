import type { HTMLAttributes } from "react";

type HiddenInputProps = {
  name: string;
  value: HTMLAttributes<HTMLInputElement>["defaultValue"] | null | undefined;
};

export function HiddenInput({ name, value }: HiddenInputProps) {
  return (
    <input
      type="text"
      className="sr-only"
      name={name}
      defaultValue={value ?? ""}
    />
  );
}
