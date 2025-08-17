// Base service interfaces and types for the service layer

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface ServiceError {
  message: string;
  code?: string;
  cause?: unknown;
}

export abstract class BaseService {
  protected handleError(error: unknown): ServiceError {
    if (error instanceof Error) {
      return {
        message: error.message,
        cause: error,
      };
    }
    return {
      message: String(error),
      cause: error,
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
    };
  }
}
