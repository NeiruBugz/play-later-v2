import type { InputHTMLAttributes } from "react";

type HiddenInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  name: string;
  value:
    | InputHTMLAttributes<HTMLInputElement>["defaultValue"]
    | null
    | undefined;
};

export function HiddenInput({ value, ...props }: HiddenInputProps) {
  return (
    <input
      type="text"
      className="sr-only"
      defaultValue={value ?? ""}
      {...props}
    />
  );
}
