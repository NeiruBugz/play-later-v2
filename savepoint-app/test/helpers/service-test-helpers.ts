import {
  ServiceErrorCode,
  type ServiceResult,
} from "@/data-access-layer/services";
import { expect } from "vitest";

export function expectServiceSuccess<T>(
  result: ServiceResult<T>
): asserts result is { success: true; data: T } {
  expect(result.success).toBe(true);
  if (!result.success) {
    throw new Error("Expected successful result");
  }
  expect(result.data).toBeDefined();
}
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
export function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data,
  };
}
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
export function isServiceSuccess<T>(
  result: ServiceResult<T>
): result is { success: true; data: T } {
  return result.success === true;
}
export function isServiceError<T>(
  result: ServiceResult<T>
): result is { success: false; error: string; code?: ServiceErrorCode } {
  return result.success === false;
}
export function createMockDate(dateString?: string): Date {
  return new Date(dateString ?? "2024-01-01T00:00:00.000Z");
}
export function createPartialMock<T>(partial: Partial<T>): Partial<T> {
  return partial;
}
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
export function buildMockLibraryItem(
  overrides: {
    id?: number;
    userId?: string;
    gameId?: string;
    status?: "WANT_TO_PLAY" | "OWNED" | "PLAYING" | "PLAYED";
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
    status: "PLAYING" as const,
    platform: "PC",
    acquisitionType: "DIGITAL" as const,
    startedAt: null,
    completedAt: null,
    createdAt: createMockDate(),
    updatedAt: createMockDate(),
    ...overrides,
  };
}
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
    publishedAt: null,
    createdAt: createMockDate(),
    updatedAt: createMockDate(),
    ...overrides,
  };
}
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
export async function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export function createRejectedPromise<T = never>(
  error: string | Error
): Promise<T> {
  return Promise.reject(typeof error === "string" ? new Error(error) : error);
}
export function createResolvedPromise<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}
