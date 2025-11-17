import { z } from "zod";
import {
  MAX_AVATAR_FILE_SIZE_BYTES,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/shared/constants";

export const CheckUsernameSchema = z.object({
  username: z.string().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
});
export type CheckUsernameInput = z.infer<typeof CheckUsernameSchema>;
export const UpdateProfileSchema = z.object({
  username: z.string().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
  avatarUrl: z.string().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export const UploadAvatarSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_AVATAR_FILE_SIZE_BYTES, {
      message: "File size exceeds 4MB",
    })
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
          file.type
        ),
      {
        message: "Unsupported file format",
      }
    ),
});
export type UploadAvatarInput = z.infer<typeof UploadAvatarSchema>;
export const CompleteProfileSetupSchema = z.object({
  username: z
    .string()
    .min(USERNAME_MIN_LENGTH)
    .max(USERNAME_MAX_LENGTH)
    .optional(),
  avatarUrl: z.string().optional(),
});
export type CompleteProfileSetupInput = z.infer<
  typeof CompleteProfileSetupSchema
>;
