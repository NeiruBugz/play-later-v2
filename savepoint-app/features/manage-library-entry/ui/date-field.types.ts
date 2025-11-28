import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";

export interface DateFieldProps<T extends FieldValues = FieldValues> {
  field: ControllerRenderProps<T, FieldPath<T>>;
  label: string;
  description?: string;
}
