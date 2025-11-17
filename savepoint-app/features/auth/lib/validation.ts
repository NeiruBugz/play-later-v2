import { z } from "zod";

import {
  PASSWORD_MIN_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
} from "@/shared/constants";

export const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export const signUpSchema = signInSchema.extend({
  password: z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `Must be at least ${PASSWORD_MIN_LENGTH} characters`
    ),
  name: z
    .string()
    .trim()
    .min(
      USER_NAME_MIN_LENGTH,
      `Name must be at least ${USER_NAME_MIN_LENGTH} characters`
    )
    .max(
      USER_NAME_MAX_LENGTH,
      `Name must be at most ${USER_NAME_MAX_LENGTH} characters`
    )
    .optional(),
});
export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type CredentialsFormValues = SignInValues & Partial<SignUpValues>;
