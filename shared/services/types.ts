// Base service interfaces and types for the service layer

import { getServerUserId } from "@/auth";

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
  cause?: string;
}

export interface ServiceError {
  message: string;
  code?: string;
  cause?: string;
}

export abstract class BaseService {
  protected async getCurrentUserId(): Promise<string> {
    const userId = await getServerUserId();
    if (!userId) {
      throw new Error("Authentication required");
    }
    return userId;
  }

  protected async getCurrentUserIdOptional(): Promise<string | undefined> {
    return await getServerUserId();
  }

  protected handleError(error: unknown): ServiceError {
    if (error instanceof Error) {
      return {
        message: error.message,
        cause: error.cause as unknown as string,
      };
    }
    return {
      message: String(error),
    };
  }

  protected createSuccessResponse<T>(data: T): ServiceResponse<T> {
    return {
      data,
      success: true,
    };
  }

  protected createErrorResponse(error: ServiceError): ServiceResponse<never> {
    return {
      error: error.message,
      success: false,
      cause: error.cause,
    };
  }
}
