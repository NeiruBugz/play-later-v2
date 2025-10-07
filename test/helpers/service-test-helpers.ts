/**
 * Service Layer Testing Utilities
 *
 * This module provides comprehensive testing utilities for service layer tests.
 * It includes mock builders, assertion helpers, and common test setup functions.
 *
 * Uses the new ServiceResult discriminated union pattern for type-safe testing.
 *
 * @example
 * ```typescript
 * import { expectServiceSuccess, expectServiceError } from '@/test/helpers/service-test-helpers';
 *
 * const result = await service.getCollection({ userId: 'user-1' });
 * expectServiceSuccess(result);
 * expect(result.data.collection).toBeDefined(); // data is guaranteed to exist
 * ```
 */

import { expect } from "vitest";

import { ServiceErrorCode, type ServiceResult } from "@/shared/services";

/**
 * Asserts that a service result is successful and contains data.
 * Uses the new ServiceResult discriminated union pattern.
 *
 * @param result - The service result to check
 * @throws {Error} If the result is not successful or data is missing
 *
 * @example
 * ```typescript
 * const result = await service.getUser({ userId: 'user-1' });
 * expectServiceSuccess(result);
 * expect(result.data.name).toBe('Test User'); // data is guaranteed to exist
 * ```
 */
export function expectServiceSuccess<T>(
  result: ServiceResult<T>
): asserts result is { success: true; data: T } {
  expect(result.success).toBe(true);
  if (!result.success) {
    throw new Error("Expected successful result");
  }
  expect(result.data).toBeDefined();
}

/**
 * Asserts that a service result is an error with optional message/code validation.
 *
 * @param result - The service result to check
 * @param expectedError - Optional expected error message or substring
 * @param expectedCode - Optional expected error code
 * @throws {Error} If the result is successful or message/code doesn't match
 *
 * @example
 * ```typescript
 * const result = await service.createItem(invalidInput);
 * expectServiceError(result, 'already exists', ServiceErrorCode.CONFLICT);
 * ```
 */
export function expectServiceError<T>(
  result: ServiceResult<T>,
  expectedError?: string,
  expectedCode?: ServiceErrorCode
): asserts result is {
  success: false;
  error: string;
  code?: ServiceErrorCode;
} {
  expect(result.success).toBe(false);
  if (result.success) {
    throw new Error("Expected error result");
  }
  expect(result.error).toBeDefined();

  if (expectedError) {
    expect(result.error).toContain(expectedError);
  }

  if (expectedCode) {
    expect(result.code).toBe(expectedCode);
  }
}

/**
 * Creates a successful service result for testing.
 *
 * @param data - The data to include in the response
 * @returns A successful ServiceResult
 *
 * @example
 * ```typescript
 * const mockResult = createSuccessResult({ users: [], count: 0 });
 * mockService.getUsers.mockResolvedValue(mockResult);
 * ```
 */
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates an error service result for testing.
 *
 * @param error - The error message
 * @param code - Optional error code
 * @returns An error ServiceResult
 *
 * @example
 * ```typescript
 * const mockResult = createErrorResult('Not found', ServiceErrorCode.NOT_FOUND);
 * mockService.getUser.mockResolvedValue(mockResult);
 * ```
 */
export function createErrorResult<T = never>(
  error: string,
  code?: ServiceErrorCode
): ServiceResult<T> {
  return {
    success: false,
    error,
    code,
  };
}

/**
 * Type guard to check if a service result is successful.
 *
 * @param result - The service result to check
 * @returns True if the result is successful
 *
 * @example
 * ```typescript
 * if (isServiceSuccess(result)) {
 *   console.log(result.data); // TypeScript knows data is defined
 * }
 * ```
 */
export function isServiceSuccess<T>(
  result: ServiceResult<T>
): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard to check if a service result is an error.
 *
 * @param result - The service result to check
 * @returns True if the result is an error
 *
 * @example
 * ```typescript
 * if (isServiceError(result)) {
 *   console.error(result.error, result.code); // TypeScript knows error is defined
 * }
 * ```
 */
export function isServiceError<T>(
  result: ServiceResult<T>
): result is { success: false; error: string; code?: ServiceErrorCode } {
  return result.success === false;
}

/**
 * Creates a mock Date for consistent testing.
 *
 * @param dateString - Optional ISO date string, defaults to a fixed date
 * @returns A Date object
 *
 * @example
 * ```typescript
 * const testDate = createMockDate('2024-01-01');
 * const user = { ...mockUser, createdAt: testDate };
 * ```
 */
export function createMockDate(dateString?: string): Date {
  return new Date(dateString ?? "2024-01-01T00:00:00.000Z");
}

/**
 * Creates a partial mock object with type safety.
 * Useful for creating test data with minimal required fields.
 *
 * @param partial - Partial object with some fields defined
 * @returns The same object, typed as Partial<T>
 *
 * @example
 * ```typescript
 * import type { User } from '@prisma/client';
 *
 * const mockUser = createPartialMock<User>({
 *   id: 'user-1',
 *   email: 'test@example.com',
 *   name: 'Test User',
 * });
 * ```
 */
export function createPartialMock<T>(partial: Partial<T>): Partial<T> {
  return partial;
}

/**
 * Test data builders for common entities.
 * These provide consistent test data with sensible defaults.
 */

/**
 * Creates a mock user object with sensible defaults.
 *
 * @param overrides - Optional fields to override defaults
 * @returns A complete user object for testing
 *
 * @example
 * ```typescript
 * const user = buildMockUser({ id: 'user-1', email: 'custom@example.com' });
 * ```
 */
export function buildMockUser(
  overrides: {
    id?: string;
    email?: string;
    name?: string;
    username?: string;
    emailVerified?: Date | null;
    image?: string | null;
    steamProfileURL?: string | null;
    steamId64?: string | null;
    steamUsername?: string | null;
    steamAvatar?: string | null;
    steamConnectedAt?: Date | null;
  } = {}
) {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    username: "testuser",
    emailVerified: null,
    image: null,
    steamProfileURL: null,
    steamId64: null,
    steamUsername: null,
    steamAvatar: null,
    steamConnectedAt: null,
    ...overrides,
  };
}

/**
 * Creates a mock game object with sensible defaults.
 *
 * @param overrides - Optional fields to override defaults
 * @returns A complete game object for testing
 *
 * @example
 * ```typescript
 * const game = buildMockGame({ id: 'game-1', title: 'Test Game' });
 * ```
 */
export function buildMockGame(
  overrides: {
    id?: string;
    igdbId?: number;
    hltbId?: number | null;
    title?: string;
    description?: string | null;
    coverImage?: string | null;
    releaseDate?: Date | null;
    mainStory?: number | null;
    mainExtra?: number | null;
    completionist?: number | null;
    steamAppId?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}
) {
  return {
    id: "test-game-id",
    igdbId: 12345,
    hltbId: null,
    title: "Test Game",
    description: "A test game description",
    coverImage: "https://example.com/cover.jpg",
    releaseDate: createMockDate("2024-01-01"),
    mainStory: 10,
    mainExtra: 15,
    completionist: 20,
    steamAppId: null,
    createdAt: createMockDate(),
    updatedAt: createMockDate(),
    ...overrides,
  };
}

/**
 * Creates a mock library item object with sensible defaults.
 *
 * @param overrides - Optional fields to override defaults
 * @returns A complete library item object for testing
 *
 * @example
 * ```typescript
 * const item = buildMockLibraryItem({
 *   userId: 'user-1',
 *   gameId: 'game-1',
 *   status: 'CURRENTLY_EXPLORING'
 * });
 * ```
 */
export function buildMockLibraryItem(
  overrides: {
    id?: number;
    userId?: string;
    gameId?: string;
    status?:
      | "CURIOUS_ABOUT"
      | "CURRENTLY_EXPLORING"
      | "TOOK_A_BREAK"
      | "EXPERIENCED"
      | "WISHLIST"
      | "REVISITING";
    platform?: string;
    acquisitionType?: "DIGITAL" | "PHYSICAL" | "SUBSCRIPTION" | "FREE_TO_PLAY";
    startedAt?: Date | null;
    completedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}
) {
  return {
    id: 1,
    userId: "test-user-id",
    gameId: "test-game-id",
    status: "CURRENTLY_EXPLORING" as const,
    platform: "PC",
    acquisitionType: "DIGITAL" as const,
    startedAt: null,
    completedAt: null,
    createdAt: createMockDate(),
    updatedAt: createMockDate(),
    ...overrides,
  };
}

/**
 * Creates a mock journal entry object with sensible defaults.
 *
 * @param overrides - Optional fields to override defaults
 * @returns A complete journal entry object for testing
 *
 * @example
 * ```typescript
 * const entry = buildMockJournalEntry({
 *   userId: 'user-1',
 *   gameId: 'game-1',
 *   title: 'Great session!'
 * });
 * ```
 */
export function buildMockJournalEntry(
  overrides: {
    id?: string;
    userId?: string;
    gameId?: string;
    libraryItemId?: number | null;
    title?: string | null;
    content?: string;
    mood?:
      | "EXCITED"
      | "RELAXED"
      | "FRUSTRATED"
      | "ACCOMPLISHED"
      | "CURIOUS"
      | "NEUTRAL"
      | null;
    playSession?: number | null;
    visibility?: "PRIVATE" | "PUBLIC";
    isPublic?: boolean;
    publishedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}
) {
  return {
    id: "test-entry-id",
    userId: "test-user-id",
    gameId: "test-game-id",
    libraryItemId: 1,
    title: "Test Journal Entry",
    content: "This is a test journal entry content.",
    mood: "EXCITED" as const,
    playSession: 1,
    visibility: "PRIVATE" as const,
    isPublic: false,
    publishedAt: null,
    createdAt: createMockDate(),
    updatedAt: createMockDate(),
    ...overrides,
  };
}

/**
 * Creates a mock review object with sensible defaults.
 *
 * @param overrides - Optional fields to override defaults
 * @returns A complete review object for testing
 *
 * @example
 * ```typescript
 * const review = buildMockReview({
 *   userId: 'user-1',
 *   gameId: 'game-1',
 *   rating: 5
 * });
 * ```
 */
export function buildMockReview(
  overrides: {
    id?: string;
    userId?: string;
    gameId?: string;
    libraryItemId?: number;
    rating?: number;
    content?: string | null;
    isRecommended?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}
) {
  return {
    id: "test-review-id",
    userId: "test-user-id",
    gameId: "test-game-id",
    libraryItemId: 1,
    rating: 4,
    content: "This is a test review.",
    isRecommended: true,
    createdAt: createMockDate(),
    updatedAt: createMockDate(),
    ...overrides,
  };
}

/**
 * Waits for a specified amount of time. Useful for testing async operations.
 *
 * @param ms - Milliseconds to wait
 *
 * @example
 * ```typescript
 * await waitFor(100);
 * expect(asyncOperation).toHaveBeenCalled();
 * ```
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a promise that rejects with the specified error.
 * Useful for mocking repository functions that should fail.
 *
 * @param error - Error message or Error object
 *
 * @example
 * ```typescript
 * mockRepository.getUser.mockImplementation(() =>
 *   createRejectedPromise('Database connection failed')
 * );
 * ```
 */
export function createRejectedPromise<T = never>(
  error: string | Error
): Promise<T> {
  return Promise.reject(typeof error === "string" ? new Error(error) : error);
}

/**
 * Creates a promise that resolves with the specified value.
 * Useful for mocking repository functions that should succeed.
 *
 * @param value - The value to resolve with
 *
 * @example
 * ```typescript
 * mockRepository.getUser.mockImplementation(() =>
 *   createResolvedPromise(mockUser)
 * );
 * ```
 */
export function createResolvedPromise<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}
