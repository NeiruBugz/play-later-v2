import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/shared/lib/errors";

import { Route } from "./profile.setup";

vi.mock("@/features/setup-profile/api/get-profile-setup-status", () => ({
  getProfileSetupStatusFn: vi.fn(),
}));

vi.mock("@/widgets/profile-setup-page", () => ({
  ProfileSetupForm: ({ defaultUsername }: { defaultUsername?: string }) => (
    <div data-testid="profile-setup-form">{defaultUsername ?? "(none)"}</div>
  ),
}));

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router"
  )),
  createFileRoute: () => (opts: unknown) => ({
    options: opts,
    useLoaderData: vi.fn(),
  }),
  Link: ({
    to,
    children,
    ...rest
  }: {
    to?: string;
    children?: React.ReactNode;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

const elements = {
  getSetupForm: () => screen.getByTestId("profile-setup-form"),
  getUnauthorizedHeading: () =>
    screen.getByRole("heading", { name: "Sign in required" }),
  getGenericHeading: () =>
    screen.getByRole("heading", { name: "Something went wrong" }),
};

const invokeLoader = () =>
  (Route.options as { loader: () => Promise<unknown> }).loader();

const renderRoute = (suggestedUsername?: string) => {
  (
    Route as unknown as { useLoaderData: () => { suggestedUsername?: string } }
  ).useLoaderData = () => ({ suggestedUsername });
  const Component = Route.options.component as ComponentType;
  render(<Component />);
};

const renderError = (error: Error) => {
  const ErrorComponent = Route.options.errorComponent as ComponentType<{
    error: Error;
  }>;
  render(<ErrorComponent error={error} />);
};

describe("/_authed/profile/setup route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given the loader resolves with a setup-needed status", () => {
    beforeEach(async () => {
      const { getProfileSetupStatusFn } =
        await import("@/features/setup-profile/api/get-profile-setup-status");
      vi.mocked(getProfileSetupStatusFn).mockResolvedValue({
        needsSetup: true,
        suggestedUsername: "adalovelace",
      });
    });

    it("returns the suggested username to the route", async () => {
      await expect(invokeLoader()).resolves.toEqual({
        suggestedUsername: "adalovelace",
      });
    });
  });

  describe("given the loader resolves with setup already complete", () => {
    beforeEach(async () => {
      const { getProfileSetupStatusFn } =
        await import("@/features/setup-profile/api/get-profile-setup-status");
      vi.mocked(getProfileSetupStatusFn).mockResolvedValue({
        needsSetup: false,
        suggestedUsername: undefined,
      });
    });

    it("redirects to /dashboard", async () => {
      await expect(invokeLoader()).rejects.toMatchObject({
        options: { to: "/dashboard" },
      });
    });
  });

  describe("given the route renders with a suggested username", () => {
    beforeEach(() => {
      renderRoute("adalovelace");
    });

    it("hands the suggestion to the setup form", () => {
      expect(elements.getSetupForm().textContent).toBe("adalovelace");
    });
  });

  describe("given the loader threw UnauthorizedError", () => {
    beforeEach(() => {
      renderError(new UnauthorizedError("Sign in required"));
    });

    it("renders the sign-in-required surface", () => {
      expect(elements.getUnauthorizedHeading()).toBeDefined();
    });
  });

  describe("given the loader threw a generic error", () => {
    beforeEach(() => {
      renderError(new Error("boom"));
    });

    it("renders the generic error surface", () => {
      expect(elements.getGenericHeading()).toBeDefined();
    });
  });
});
