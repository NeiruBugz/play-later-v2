import { afterEach, vi } from "vitest";
import { setupAuthMocks } from "./auth-mock";

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
    backlogItem: {
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
setupAuthMocks();

// Mock Next.js functions
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

process.env.NEXTAUTH_SECRET = "test-secret";
process.env.POSTGRES_PRISMA_URL = "postgresql://test:test@localhost:5432/test";

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
