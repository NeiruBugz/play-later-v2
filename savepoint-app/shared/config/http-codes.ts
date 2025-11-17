export const HTTP_RESPONSE = {
  ok: {
    status: "Ok",
    code: 200,
  },
  unauthorized: {
    status: "Unauthorized",
    code: 401,
  },
};

/**
 * HTTP Status Codes
 * Comprehensive list of status codes used throughout the application
 */
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
