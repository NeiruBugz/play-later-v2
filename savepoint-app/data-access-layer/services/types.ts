/**
 * Shared Service Layer Types
 *
 * This module defines core types used across all service layer implementations.
 * These types enforce the standardized Zod-first validation strategy where:
 * - Server actions validate input shape/types using Zod schemas
 * - Services receive pre-validated, type-safe inputs
 * - Services validate ONLY business rules (duplicates, permissions, state)
 *
 * @module shared/services/types
 */

import { logger } from "@/shared/lib/logger";

// ============================================================================
// Service Result Types (Discriminated Union Pattern)
// ============================================================================

/**
 * Standard service layer response type using discriminated union pattern.
 * This enables exhaustive type checking and ensures type-safe error handling.
 *
 * @template TData - The type of data returned on success
 *
 * @example
 * ```typescript
 * // Success case
 * const result: ServiceResult<{ item: LibraryItem }> = {
 *   success: true,
 *   data: { item: libraryItem }
 * };
 *
 * // Error case
 * const result: ServiceResult<{ item: LibraryItem }> = {
 *   success: false,
 *   error: 'Game already exists in library',
 *   code: ServiceErrorCode.CONFLICT
 * };
 *
 * // Type-safe exhaustive checking
 * if (result.success) {
 *   console.log(result.data.item); // TypeScript knows data exists
 * } else {
 *   console.error(result.error, result.code); // TypeScript knows error exists
 * }
 * ```
 */
export type ServiceResult<TData> =
  | {
      success: true;
      data: TData;
    }
  | {
      success: false;
      error: string;
      code?: ServiceErrorCode;
    };

// ============================================================================
// Service Error Codes
// ============================================================================

/**
 * Standard error codes for service layer responses.
 * These codes enable consistent error handling across the application.
 *
 * @example
 * ```typescript
 * // Business validation error
 * return {
 *   success: false,
 *   error: 'Game already exists in your library',
 *   code: ServiceErrorCode.CONFLICT
 * };
 *
 * // Authorization error
 * return {
 *   success: false,
 *   error: 'You do not have permission to modify this resource',
 *   code: ServiceErrorCode.UNAUTHORIZED
 * };
 * ```
 */
export enum ServiceErrorCode {
  /**
   * Business validation error (e.g., duplicate resource, invalid state transition)
   * Use when business rules are violated, NOT for input shape validation (use Zod)
   */
  VALIDATION_ERROR = "VALIDATION_ERROR",

  /**
   * Resource not found in database
   * Use when querying for a resource that doesn't exist
   */
  NOT_FOUND = "NOT_FOUND",

  /**
   * User lacks permission to perform action
   * Use when authorization checks fail (e.g., resource doesn't belong to user)
   */
  UNAUTHORIZED = "UNAUTHORIZED",

  /**
   * Resource already exists or conflicting state
   * Use when attempting to create a duplicate or invalid state change
   */
  CONFLICT = "CONFLICT",

  /**
   * Unexpected internal error (database, external API, etc.)
   * Use as fallback for unexpected errors
   */
  INTERNAL_ERROR = "INTERNAL_ERROR",

  /**
   * External service or dependency error
   * Use when external APIs or services fail
   */
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Standard pagination result wrapper.
 *
 * @template TItem - The type of items in the paginated list
 *
 * @example
 * ```typescript
 * async getLibraryItems(input: GetLibraryItemsInput): Promise<ServiceResult<PaginatedResult<LibraryItem>>> {
 *   const items = await this.repo.findMany(input);
 *   const total = await this.repo.count(input);
 *
 *   return {
 *     success: true,
 *     data: {
 *       items,
 *       total,
 *       page: input.page ?? 1,
 *       pageSize: input.pageSize ?? 50,
 *       hasMore: (input.page ?? 1) * (input.pageSize ?? 50) < total
 *     }
 *   };
 * }
 * ```
 */
export type PaginatedResult<TItem> = {
  /** Array of items for the current page */
  items: TItem[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Whether more pages exist after current page */
  hasMore: boolean;
};

/**
 * Standard pagination input parameters.
 * Use as base for service method inputs that support pagination.
 *
 * @example
 * ```typescript
 * interface GetLibraryItemsInput extends PaginationInput {
 *   userId: string;
 *   status?: LibraryItemStatus;
 *   platform?: string;
 * }
 * ```
 */
export type PaginationInput = {
  /** Page number (1-indexed), defaults to 1 */
  page?: number;
  /** Number of items per page, defaults to 50 */
  pageSize?: number;
  /** Optional cursor for cursor-based pagination */
  cursor?: string;
};

/**
 * Cursor-based pagination result (alternative to offset pagination).
 * Use for infinite scroll or real-time feeds.
 *
 * @template TItem - The type of items in the paginated list
 *
 * @example
 * ```typescript
 * async getFeed(input: { cursor?: string }): Promise<ServiceResult<CursorPaginatedResult<Post>>> {
 *   const items = await this.repo.findMany({ cursor: input.cursor, take: 20 });
 *   const nextCursor = items.length === 20 ? items[items.length - 1].id : null;
 *
 *   return {
 *     success: true,
 *     data: {
 *       items,
 *       nextCursor,
 *       hasMore: nextCursor !== null
 *     }
 *   };
 * }
 * ```
 */
export type CursorPaginatedResult<TItem> = {
  /** Array of items for the current page */
  items: TItem[];
  /** Cursor for the next page, null if no more pages */
  nextCursor: string | null;
  /** Whether more pages exist */
  hasMore: boolean;
};

// ============================================================================
// Base Service Input Types
// ============================================================================

/**
 * Base input type for service methods that require user context.
 * Extend this for service inputs that need user authentication.
 *
 * @example
 * ```typescript
 * interface CreateLibraryItemInput extends BaseServiceInput {
 *   gameId: string;
 *   platform?: string;
 *   status?: LibraryItemStatus;
 * }
 *
 * class LibraryService {
 *   async createItem(input: CreateLibraryItemInput): Promise<ServiceResult<{ item: LibraryItem }>> {
 *     // input.userId is always available
 *   }
 * }
 * ```
 */
export type BaseServiceInput = {
  /** Authenticated user ID (provided by server action after auth) */
  userId: string;
};

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extract the success data type from a ServiceResult type.
 * Useful for type inference in tests and type utilities.
 *
 * @example
 * ```typescript
 * type GetItemResult = ServiceResult<{ item: LibraryItem }>;
 * type ItemData = ExtractServiceData<GetItemResult>; // { item: LibraryItem }
 * ```
 */
export type ExtractServiceData<T> =
  T extends ServiceResult<infer TData> ? TData : never;

/**
 * Type guard to check if a result is successful.
 * Narrows the type to success branch.
 *
 * @example
 * ```typescript
 * const result = await service.getItem('item-1');
 *
 * if (isSuccessResult(result)) {
 *   console.log(result.data); // TypeScript knows data exists
 * } else {
 *   console.error(result.error); // TypeScript knows error exists
 * }
 * ```
 */
export function isSuccessResult<TData>(
  result: ServiceResult<TData>
): result is { success: true; data: TData } {
  return result.success === true;
}

/**
 * Type guard to check if a result is an error.
 * Narrows the type to error branch.
 *
 * @example
 * ```typescript
 * const result = await service.createItem(input);
 *
 * if (isErrorResult(result)) {
 *   if (result.code === ServiceErrorCode.CONFLICT) {
 *     // Handle duplicate error
 *   }
 * }
 * ```
 */
export function isErrorResult<TData>(
  result: ServiceResult<TData>
): result is { success: false; error: string; code?: ServiceErrorCode } {
  return result.success === false;
}

// ============================================================================
// Base Service Class (Helper Methods)
// ============================================================================

/**
 * Base service class providing standardized response creation helpers.
 * All service classes should extend this for consistent response handling.
 *
 * @example
 * ```typescript
 * class LibraryService extends BaseService {
 *   async createItem(input: CreateInput): Promise<ServiceResult<{ item: LibraryItem }>> {
 *     // Business validation (NOT input shape - Zod already did that)
 *     const exists = await this.repo.findByUserAndGame(input.userId, input.gameId);
 *     if (exists) {
 *       return this.error('Game already in library', ServiceErrorCode.CONFLICT);
 *     }
 *
 *     // Business logic
 *     const item = await this.repo.create(input);
 *     return this.success({ item });
 *   }
 * }
 * ```
 */
export abstract class BaseService {
  /**
   * Creates a successful service result.
   *
   * @param data - The data to return
   * @returns ServiceResult with success=true
   */
  protected success<TData>(data: TData): ServiceResult<TData> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Creates an error service result.
   *
   * @param message - Human-readable error message
   * @param code - Optional error code for programmatic handling
   * @returns ServiceResult with success=false
   */
  protected error(
    message: string,
    code?: ServiceErrorCode
  ): ServiceResult<never> {
    return {
      success: false,
      error: message,
      code,
    };
  }

  /**
   * Handles unexpected errors and converts them to service results.
   * Use in try-catch blocks for database or external service errors.
   *
   * @param error - The caught error
   * @param fallbackMessage - Message to use if error has no message
   * @returns ServiceResult with INTERNAL_ERROR code
   */
  protected handleError(
    error: unknown,
    fallbackMessage = "An unexpected error occurred"
  ): ServiceResult<never> {
    const message = error instanceof Error ? error.message : fallbackMessage;

    // Log the error with structured data
    logger.error(
      {
        error,
        service: this.constructor.name,
        message,
      },
      "Service error occurred"
    );

    return this.error(message, ServiceErrorCode.INTERNAL_ERROR);
  }

  // ============================================================================
  // Legacy Methods (Deprecated - for backward compatibility)
  // ============================================================================

  /**
   * @deprecated Use success() instead
   * Legacy method for backward compatibility with old ServiceResponse type
   */
  protected createSuccessResponse<T>(data: T): ServiceResponse<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * @deprecated Use error() instead
   * Legacy method for backward compatibility with old ServiceResponse type
   */
  protected createErrorResponse(error: {
    message: string;
    code?: string;
    cause?: unknown;
  }): ServiceResponse<never> {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// Legacy Types (Deprecated - for backward compatibility)
// ============================================================================

/**
 * @deprecated Use ServiceResult instead
 * Legacy type kept for backward compatibility during migration
 */
export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * @deprecated Use ServiceErrorCode enum instead
 * Legacy type kept for backward compatibility during migration
 */
export interface ServiceError {
  message: string;
  code?: string;
  cause?: unknown;
}
