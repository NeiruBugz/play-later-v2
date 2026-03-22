import { getServerUserId } from "@/shared/lib/auth";
import type { ZodSchema } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type AuthenticatedHandlerParams<TInput> = {
  input: TInput;
  userId: string;
  logger: ReturnType<typeof createLogger>;
};

type OptionalAuthHandlerParams<TInput> = {
  input: TInput;
  userId: string | undefined;
  logger: ReturnType<typeof createLogger>;
};

type AuthenticatedServerActionOptions<TInput, TOutput> = {
  actionName: string;
  schema: ZodSchema<TInput>;
  requireAuth?: true;
  handler: (
    params: AuthenticatedHandlerParams<TInput>
  ) => Promise<ActionResult<TOutput>>;
};

type OptionalAuthServerActionOptions<TInput, TOutput> = {
  actionName: string;
  schema: ZodSchema<TInput>;
  requireAuth: false;
  handler: (
    params: OptionalAuthHandlerParams<TInput>
  ) => Promise<ActionResult<TOutput>>;
};

export function createServerAction<TInput, TOutput>(
  options:
    | AuthenticatedServerActionOptions<TInput, TOutput>
    | OptionalAuthServerActionOptions<TInput, TOutput>
) {
  const { actionName, schema, requireAuth = true, handler } = options;
  const logger = createLogger({ [LOGGER_CONTEXT.SERVER_ACTION]: actionName });
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    try {
      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        logger.warn({ errors: parsed.error.issues }, "Invalid input data");
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
      } else {
        userId = await getServerUserId();
      }
      return await (handler as (params: OptionalAuthHandlerParams<TInput>) => Promise<ActionResult<TOutput>>)({
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
