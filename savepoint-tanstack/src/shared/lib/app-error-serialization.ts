import { createSerializationAdapter } from "@tanstack/react-router";

import {
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  UpstreamError,
  ValidationError,
  type AppErrorCode,
} from "./errors";

type SerializableContext = { code: string };

interface SerializedAppError {
  code: AppErrorCode;
  message: string;
  context?: SerializableContext;
}

const ERROR_CLASS_BY_CODE: Record<
  AppErrorCode,
  new (message: string, context?: Record<string, unknown>) => AppError
> = {
  NOT_FOUND: NotFoundError,
  CONFLICT: ConflictError,
  VALIDATION: ValidationError,
  UNAUTHORIZED: UnauthorizedError,
  UPSTREAM: UpstreamError,
};

export const appErrorSerializationAdapter = createSerializationAdapter<
  AppError,
  SerializedAppError
>({
  key: "AppError",
  test: (value): value is AppError => value instanceof AppError,
  toSerializable: ({ code, message, context }) => ({
    code,
    message,
    ...(typeof context?.code === "string"
      ? { context: { code: context.code } }
      : {}),
  }),
  fromSerializable: ({ code, message, context }) =>
    new ERROR_CLASS_BY_CODE[code](message, context),
});
