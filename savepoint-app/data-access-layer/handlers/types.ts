/**
 * Shared types for handler layer
 *
 * Handlers are the orchestration layer between HTTP endpoints (API routes, server actions)
 * and business logic (services, use-cases). They handle:
 * - Input validation
 * - Rate limiting
 * - Request coordination
 * - Response formatting
 */

/**
 * Handler result type - similar to ServiceResult but includes HTTP status codes
 */
export type HandlerResult<TData> =
  | {
      success: true;
      data: TData;
      status: number;
    }
  | {
      success: false;
      error: string;
      status: number;
      headers?: HeadersInit;
    };

/**
 * Request context extracted from HTTP requests
 * Provides handlers with necessary request metadata
 */
export interface RequestContext {
  /** Client IP address (for rate limiting) */
  ip: string;
  /** Request headers */
  headers: Headers;
  /** Parsed URL with query parameters */
  url: URL;
}

/**
 * Generic handler function signature
 */
export type Handler<TInput, TOutput> = (
  input: TInput,
  context: RequestContext
) => Promise<HandlerResult<TOutput>>;
