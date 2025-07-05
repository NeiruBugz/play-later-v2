import { getServerUserId } from "@/auth";
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

const safeActionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
      requiresAuth: z.boolean().default(true),
    });
  },
  defaultValidationErrorsShape: "flattened",
  handleServerError: (error) => {
    if (error instanceof AuthenticationError) {
      return error.message;
    }

    console.error("Action error:", error.message);

    return "Oh no, something went wrong!";
  },
});

const authorizedActionClient = safeActionClient.use(
  async ({ next, metadata }) => {
    if (metadata.requiresAuth) {
      const userId = await getServerUserId();

      if (!userId) {
        throw new AuthenticationError(
          "Authentication required. Please sign in to continue."
        );
      }

      return next({
        ctx: {
          userId,
        },
      });
    }

    return next({
      ctx: {},
    });
  }
);

const publicActionClient = safeActionClient.use(async ({ next }) => {
  return next({
    ctx: {},
  });
});

export { safeActionClient, authorizedActionClient, publicActionClient };
