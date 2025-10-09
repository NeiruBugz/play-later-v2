import { afterEach, beforeAll, vi } from "vitest";

// Hoist all mocks to the top level before any imports can happen
vi.mock("server-only", () => ({}));

vi.mock("@/shared/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(),
    game: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    libraryItem: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    review: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
  getServerUserId: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
}));

// Add the repository mocks that were in individual test files
vi.mock("@/data-access-layer/repository", () => ({
  createLibraryItem: vi.fn(),
  deleteLibraryItem: vi.fn(),
  updateLibraryItem: vi.fn(),
  getManyLibraryItems: vi.fn(),
  getOtherUsersLibraryItems: vi.fn(),
  updateUserData: vi.fn(),
  createReview: vi.fn(),
}));

// Add the add-game mock
vi.mock("@/features/add-game/server-actions/add-game", () => ({
  saveGameAndAddToLibrary: vi.fn(),
}));

// Set up environment variables before any modules load
beforeAll(() => {
  process.env.NEXTAUTH_SECRET = "test-secret";
  process.env.POSTGRES_PRISMA_URL =
    "postgresql://postgres:postgres@localhost:6432/test";
  // @ts-expect-error - NODE_ENV is read-only
  process.env.NODE_ENV = "test";
});

declare global {
  var testUtils: {
    createMockFormData: (data: Record<string, string>) => FormData;
  };
}

global.testUtils = {
  createMockFormData: (data: Record<string, string>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  },
};

afterEach(() => {
  vi.clearAllMocks();
});
