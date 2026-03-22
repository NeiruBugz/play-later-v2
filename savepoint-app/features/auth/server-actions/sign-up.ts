"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SignUpSchema, type SignUpInput } from "@/features/auth/schemas";
import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { auth } from "@/shared/lib/auth";

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
    const result = await auth.api.signUpEmail({
      body: {
        email: validated.data.email,
        password: validated.data.password,
        name: validated.data.name ?? "",
      },
      headers: await headers(),
    });

    if (!result) {
      return {
        success: false as const,
        error: "Failed to create account",
      };
    }

    logger.info({}, "User signed up successfully");
  } catch (error) {
    logger.error({ err: error }, "Unexpected error during sign up");
    return {
      success: false as const,
      error: "An unexpected error occurred",
    };
  }

  redirect("/dashboard");
}
