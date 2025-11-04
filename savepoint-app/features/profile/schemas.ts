import { z } from "zod";

export const CheckUsernameSchema = z.object({
  username: z.string().min(3).max(25),
});

export type CheckUsernameInput = z.infer<typeof CheckUsernameSchema>;

export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(25),
  avatarUrl: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const UploadAvatarSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 4 * 1024 * 1024, {
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
  username: z.string().min(3).max(25).optional(),
  avatarUrl: z.string().optional(),
});

export type CompleteProfileSetupInput = z.infer<
  typeof CompleteProfileSetupSchema
>;
