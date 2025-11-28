import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";

export interface StatusSelectProps<T extends FieldValues = FieldValues> {
  field: ControllerRenderProps<T, FieldPath<T>>;
  description?: string;
  className?: string;
}
