import { Prisma } from "@prisma/client";

import { logger } from "@/shared/lib";

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

export enum ServiceErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",

  NOT_FOUND = "NOT_FOUND",

  UNAUTHORIZED = "UNAUTHORIZED",

  CONFLICT = "CONFLICT",

  INTERNAL_ERROR = "INTERNAL_ERROR",

  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}

export type PaginatedResult<TItem> = {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type PaginationInput = {
  page?: number;
  pageSize?: number;
  cursor?: string;
};

export type CursorPaginatedResult<TItem> = {
  items: TItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type BaseServiceInput = {
  userId: string;
};

export type ExtractServiceData<T> =
  T extends ServiceResult<infer TData> ? TData : never;

export function isSuccessResult<TData>(
  result: ServiceResult<TData>
): result is { success: true; data: TData } {
  return result.success === true;
}

export function isErrorResult<TData>(
  result: ServiceResult<TData>
): result is { success: false; error: string; code?: ServiceErrorCode } {
  return result.success === false;
}

export abstract class BaseService {
  protected success<TData>(data: TData): ServiceResult<TData> {
    return {
      success: true,
      data,
    };
  }

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

  protected handleError(
    error: unknown,
    fallbackMessage = "An unexpected error occurred"
  ): ServiceResult<never> {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return this.error("Resource already exists", ServiceErrorCode.CONFLICT);
    }

    const message = error instanceof Error ? error.message : fallbackMessage;
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
