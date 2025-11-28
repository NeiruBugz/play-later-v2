import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";

import type { PlatformDomain } from "@/shared/types";

export interface PlatformComboboxProps<T extends FieldValues = FieldValues> {
  field: ControllerRenderProps<T, FieldPath<T>>;
  supportedPlatforms: PlatformDomain[];
  otherPlatforms: PlatformDomain[];
  isLoading?: boolean;
  description?: string;
}
