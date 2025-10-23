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
