import { getServerUserId } from "@/auth";
import type { ZodSchema } from "zod";
import { createLogger } from "@/shared/lib/app/logger";
import { LOGGER_CONTEXT } from "@/shared/lib/app/logger-context";
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
type ServerActionOptions<TInput, TOutput> = {
  actionName: string;
  schema: ZodSchema<TInput>;
  requireAuth?: boolean;
  handler: (params: {
    input: TInput;
    userId?: string;
    logger: ReturnType<typeof createLogger>;
  }) => Promise<ActionResult<TOutput>>;
};

export function createServerAction<TInput, TOutput>({
  actionName,
  schema,
  requireAuth = true,
  handler,
}: ServerActionOptions<TInput, TOutput>) {
  const logger = createLogger({ [LOGGER_CONTEXT.SERVER_ACTION]: actionName });
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    try {
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        logger.warn({ errors: parsed.error.errors }, "Invalid input data");
        return {
          success: false,
          error: "Invalid input data",
        };
      }
      let userId: string | undefined;
      if (requireAuth) {
        userId = await getServerUserId();
        if (!userId) {
          logger.warn(`Unauthenticated user attempted to call ${actionName}`);
          return {
            success: false,
            error: "You must be logged in to perform this action",
          };
        }
      }
      return await handler({
        input: parsed.data,
        userId,
        logger,
      });
    } catch (error) {
      logger.error({ error }, `Unexpected error in ${actionName}`);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  };
}
