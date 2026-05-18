import { expect, it, vi } from "vitest";

it("harness sentinel: jsdom globals are wired", () => {
  expect(typeof window).toBe("object");
  expect(typeof document).toBe("object");
  expect(typeof document.createElement).toBe("function");
});

it("harness sentinel: Vite import.meta.env is present in jsdom project", () => {
  expect(import.meta.env).toBeDefined();
  expect(typeof import.meta.env).toBe("object");
});

it("harness sentinel: Prisma mock for @/lib/db is reachable via vi.mocked factory", async () => {
  const { prisma } = await import("@/shared/lib/db.server");
  expect(vi.isMockFunction(prisma.user.findUnique)).toBe(true);
  expect(vi.isMockFunction(prisma.game.findMany)).toBe(true);
  expect(vi.isMockFunction(prisma.libraryItem.count)).toBe(true);
});
