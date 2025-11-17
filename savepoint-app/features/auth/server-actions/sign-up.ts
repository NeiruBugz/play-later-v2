"use server";

import { signIn } from "@/auth";
import { AuthService } from "@/data-access-layer/services";
import z from "zod";

import { SignUpFormData, signUpSchema } from "@/features/auth/lib/types";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { isNextAuthRedirect } from "@/shared/lib/auth/handle-next-auth-error";

const logger = createLogger({
  [LOGGER_CONTEXT.SERVER_ACTION]: "signUpAction",
});
export async function signUpAction(data: SignUpFormData) {
  try {
    const validatedData = signUpSchema.parse(data);
    const authService = new AuthService();
    const result = await authService.signUp(validatedData);
    if (!result.success) {
      logger.error({ err: result.error }, "Failed to sign up user");
      return {
        success: false as const,
        error: result.error,
      };
    }
    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirectTo: "/dashboard",
    });
    logger.info({}, "User signed up successfully");
    return {
      success: true as const,
      message: result.data.message,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn({ err: error }, "Validation error during sign up");
      return {
        success: false as const,
        error: error.errors[0]?.message ?? "Validation error",
      };
    }
    if (isNextAuthRedirect(error)) {
      logger.debug("Redirecting user to dashboard after successful sign up");
      throw error;
    }
    logger.error({ err: error }, "Unexpected error occurred during sign up");
    return {
      success: false as const,
      error: "An unexpected error occurred",
    };
  }
}
