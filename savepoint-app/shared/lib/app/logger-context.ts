export const LOGGER_CONTEXT = {
  SERVICE: "service",
  SERVER_ACTION: "serverAction",
  PAGE: "page",
  ERROR_BOUNDARY: "errorBoundary",
  STORAGE: "storage",
  API_ROUTE: "apiRoute",
  DATABASE: "database",
  HANDLER: "handler",
} as const;

export type LoggerContextKey =
  (typeof LOGGER_CONTEXT)[keyof typeof LOGGER_CONTEXT];
