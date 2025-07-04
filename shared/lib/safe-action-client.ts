import { getServerUserId } from "@/auth";
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";

const safeActionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
  defaultValidationErrorsShape: "flattened",
  handleServerError: (error) => {
    // Log to console.
    console.error("Action error:", error.message);

    // Return generic message
    return "Oh no, something went wrong!";
  },
});

const authorizedActionClient = safeActionClient.use(async ({ next }) => {
  const userId = await getServerUserId();

  if (!userId) {
    throw new Error("Authentication required. Please sign in to continue.");
  }

  return next({
    ctx: {
      userId,
    },
  });
});

export { safeActionClient, authorizedActionClient };
