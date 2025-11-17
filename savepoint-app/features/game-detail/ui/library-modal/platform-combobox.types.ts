import type { Platform } from "@prisma/client";
import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";

export interface PlatformComboboxProps<T extends FieldValues = FieldValues> {
  field: ControllerRenderProps<T, FieldPath<T>>;
  supportedPlatforms: Platform[];
  otherPlatforms: Platform[];
  isLoading?: boolean;
  description?: string;
}
