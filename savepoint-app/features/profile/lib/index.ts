// Shared profile utilities
// Used by both profile and setup-profile features

export { validateUsername } from "./validation";
export type { ValidationResult } from "./validation";

export { statusLabels, initialFormState } from "./constants";

export {
  CheckUsernameSchema,
  UpdateProfileSchema,
  UploadAvatarSchema,
  CompleteProfileSetupSchema,
} from "./schemas";
export type {
  CheckUsernameInput,
  UpdateProfileInput,
  UploadAvatarInput,
  CompleteProfileSetupInput,
} from "./schemas";
