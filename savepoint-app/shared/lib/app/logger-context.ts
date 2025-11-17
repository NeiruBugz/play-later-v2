export const LOGGER_CONTEXT = {
  SERVICE: "service",
  SERVER_ACTION: "serverAction",
  PAGE: "page",
  ERROR_BOUNDARY: "errorBoundary",
  STORAGE: "storage",
  API_ROUTE: "apiRoute",
  DATABASE: "database",
  HANDLER: "handler",
  USE_CASE: "useCase",
} as const;
export type LoggerContextKey =
  (typeof LOGGER_CONTEXT)[keyof typeof LOGGER_CONTEXT];
