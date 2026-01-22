"use server";

import { signIn } from "@/auth";
import { AuthService } from "@/data-access-layer/services";

import { SignUpSchema, type SignUpInput } from "@/features/auth/schemas";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { isNextAuthRedirect } from "@/shared/lib/auth/handle-next-auth-error";

const logger = createLogger({
  [LOGGER_CONTEXT.SERVER_ACTION]: "signUpAction",
});
export async function signUpAction(data: SignUpInput) {
  const validated = SignUpSchema.safeParse(data);
  if (!validated.success) {
    logger.warn({ err: validated.error }, "Validation error during sign up");
    return {
      success: false as const,
      error: validated.error.issues[0]?.message ?? "Validation error",
    };
  }

  try {
    const authService = new AuthService();
    const result = await authService.signUp(validated.data);
    if (!result.success) {
      logger.error({ err: result.error }, "Failed to sign up user");
      return {
        success: false as const,
        error: result.error,
      };
    }
    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirectTo: "/dashboard",
    });
    logger.info({}, "User signed up successfully");
    return {
      success: true as const,
      message: result.data.message,
    };
  } catch (error) {
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
