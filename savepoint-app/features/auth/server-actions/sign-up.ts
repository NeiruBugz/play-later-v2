"use server";

import { auth } from "@/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { SignUpSchema, type SignUpInput } from "@/features/auth/schemas";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

const logger = createLogger({
  [LOGGER_CONTEXT.SERVER_ACTION]: "signUpAction",
});

export async function signUpAction(
  data: SignUpInput
): Promise<
  { success: true; message: string } | { success: false; error: string }
> {
  const validated = SignUpSchema.safeParse(data);
  if (!validated.success) {
    logger.warn({ err: validated.error }, "Validation error during sign up");
    return {
      success: false,
      error: validated.error.issues[0]?.message ?? "Validation error",
    };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email: validated.data.email,
        password: validated.data.password,
        name: validated.data.name ?? validated.data.email,
      },
      headers: await headers(),
    });
    logger.info({}, "User signed up successfully");
    return {
      success: true,
      message: "Account created successfully",
    };
  } catch (error) {
    if (error instanceof APIError) {
      logger.warn(
        { status: error.status, message: error.message },
        "BA error during sign up"
      );
      return {
        success: false,
        error: error.message,
      };
    }
    logger.error({ err: error }, "Unexpected error occurred during sign up");
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
