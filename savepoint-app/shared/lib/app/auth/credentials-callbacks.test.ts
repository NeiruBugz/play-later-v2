import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../password", () => ({
  verifyPassword: vi.fn(),
}));

import { prisma } from "../db";
import { verifyPassword } from "../password";
import { onAuthorize } from "./credentials-callbacks";

describe("onAuthorize (credentials)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when email or password missing", async () => {
    // @ts-expect-error – testing missing fields
    expect(await onAuthorize({})).toBeNull();
    // @ts-expect-error – testing missing password
    expect(await onAuthorize({ email: "user@example.com" })).toBeNull();
    // @ts-expect-error – testing missing email
    expect(await onAuthorize({ password: "secret" })).toBeNull();
  });

  it("normalizes email and looks up user", async () => {
    const mockUser = {
      id: "u1",
      email: "user@example.com",
      name: "User",
      image: null as string | null,
      password: "$2b$hash",
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const res = await onAuthorize({
      email: "  USER@example.com  ",
      password: "secret",
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        password: true,
      },
    });
    expect(res).toEqual({ id: "u1", email: "user@example.com", name: "User", image: null });
  });

  it("returns null when user not found or has no password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as any);
    expect(
      await onAuthorize({ email: "user@example.com", password: "secret" })
    ).toBeNull();

    vi.mocked(prisma.user.findUnique).mockResolvedValue({ password: null } as any);
    expect(
      await onAuthorize({ email: "user@example.com", password: "secret" })
    ).toBeNull();
  });

  it("returns null when password verification fails", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ password: "hash" } as any);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const res = await onAuthorize({ email: "user@example.com", password: "bad" });
    expect(res).toBeNull();
  });
});

