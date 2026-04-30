import { ZodError } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import {
  ConflictError,
  DomainError,
  ExternalServiceError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
} from "@/shared/lib/errors";

import type { HandlerResult } from "./types";

const logger = createLogger({ [LOGGER_CONTEXT.HANDLER]: "mapError" });

function resolveStatus(error: unknown): number {
  if (error instanceof ZodError) return 400;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof UnauthorizedError) return 401;
  if (error instanceof ConflictError) return 409;
  if (error instanceof RateLimitError) return 429;
  if (error instanceof ExternalServiceError) return 503;
  return 500;
}

function resolveMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export function mapErrorToHandlerResult(error: unknown): HandlerResult<never> {
  const status = resolveStatus(error);
  const message = resolveMessage(error);

  const context =
    error instanceof DomainError && error.context ? error.context : undefined;

  if (status >= 500) {
    logger.error({ error, context }, message);
  } else {
    logger.warn({ error, context }, message);
  }

  return {
    success: false,
    error: message,
    status,
  };
}
