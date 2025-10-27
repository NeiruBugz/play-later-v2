import { z } from "zod";

/**
 * Schema for checking username availability
 */
export const CheckUsernameSchema = z.object({
  username: z.string().min(3).max(25),
});

export type CheckUsernameInput = z.infer<typeof CheckUsernameSchema>;

/**
 * Schema for updating user profile
 */
export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(25),
  avatarUrl: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/**
 * Schema for uploading avatar
 * Validates file size (max 5MB) and MIME type
 */
export const UploadAvatarSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size exceeds 5MB",
    })
    .refine(
      (file) => ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type),
      {
        message: "Unsupported file format",
      }
    ),
});

export type UploadAvatarInput = z.infer<typeof UploadAvatarSchema>;
