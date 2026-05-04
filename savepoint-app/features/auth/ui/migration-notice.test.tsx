import { render, screen } from "@testing-library/react";
import { cookies } from "next/headers";
import { describe, expect, it, vi } from "vitest";

import { MigrationNotice } from "./migration-notice";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("../server-actions/clear-migrated-cookie", () => ({
  clearMigratedCookieAction: vi.fn(),
}));

vi.mock("./migration-notice-client", () => ({
  MigrationNoticeCookieClearer: () => null,
}));

const mockCookies = vi.mocked(cookies);

function makeStore(value: string | undefined) {
  return {
    get: (name: string) =>
      name === "auth_migrated" && value !== undefined
        ? { name, value }
        : undefined,
  };
}

describe("MigrationNotice", () => {
  describe("when auth_migrated cookie is absent", () => {
    it("renders nothing", async () => {
      mockCookies.mockResolvedValue(makeStore(undefined) as never);

      const { container } = render(await MigrationNotice());

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("when auth_migrated cookie is present", () => {
    it("renders a notice with role=status", async () => {
      mockCookies.mockResolvedValue(makeStore("1") as never);

      render(await MigrationNotice());

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("contains the sign-in system upgrade message", async () => {
      mockCookies.mockResolvedValue(makeStore("1") as never);

      render(await MigrationNotice());

      expect(screen.getByRole("status").textContent).toMatch(
        /upgraded our sign-in system/i
      );
    });

    it("contains the data-safety assurance", async () => {
      mockCookies.mockResolvedValue(makeStore("1") as never);

      render(await MigrationNotice());

      expect(screen.getByRole("status").textContent).toMatch(
        /library, journal, and settings/i
      );
    });
  });
});
