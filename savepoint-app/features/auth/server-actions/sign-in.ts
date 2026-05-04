"use server";

import { auth } from "@/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { SignInSchema, type SignInInput } from "@/features/auth/schemas";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

export async function signInAction(
  data: SignInInput
): Promise<
  { success: true; message: string } | { success: false; error: string }
> {
  const logger = createLogger({
    [LOGGER_CONTEXT.SERVER_ACTION]: "signInAction",
  });

  const validated = SignInSchema.safeParse(data);
  if (!validated.success) {
    logger.warn({ err: validated.error }, "Validation error during sign in");
    return {
      success: false,
      error: validated.error.issues[0]?.message ?? "Validation error",
    };
  }

  try {
    logger.info({ method: "credentials" }, "Signing in user");
    await auth.api.signInEmail({
      body: {
        email: validated.data.email,
        password: validated.data.password,
      },
      headers: await headers(),
    });
    return {
      success: true,
      message: "Signed in successfully",
    };
  } catch (error) {
    if (error instanceof APIError) {
      logger.warn(
        { status: error.status, message: error.message },
        "Invalid credentials during sign in"
      );
      return {
        success: false,
        error: "Invalid email or password",
      };
    }
    logger.error({ err: error }, "Unexpected error during sign in");
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
