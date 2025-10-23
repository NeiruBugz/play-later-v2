import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = signInSchema.extend({
  password: z.string().min(8, "Must be at least 8 characters"),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .optional(),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;

export type CredentialsFormValues = SignInValues & Partial<SignUpValues>;
