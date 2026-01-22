import { z } from "zod";

import {
  PASSWORD_MIN_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_NAME_MIN_LENGTH,
} from "@/shared/constants";

export const SignInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const SignUpSchema = SignInSchema.extend({
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

export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type CredentialsFormValues = SignInInput & Partial<SignUpInput>;
