import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUserFn } from "@/entities/session/api/get-current-user";

import { Route } from "./index";

vi.mock("@/entities/session/api/get-current-user", () => ({
  getCurrentUserFn: vi.fn(),
}));

vi.mock("@/widgets/landing-hero", () => ({
  LandingHero: () => <div data-testid="landing-hero" />,
}));

vi.mock("@/widgets/landing-features", () => ({
  LandingFeaturesStrip: () => <div data-testid="landing-features-strip" />,
  LandingPreviewCard: () => <div data-testid="landing-preview-card" />,
  LandingFeatures: () => <div data-testid="landing-features" />,
}));

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<any>("@tanstack/react-router")),
  createFileRoute: () => (opts: any) => ({ options: opts }),
  redirect: (opts: any) => {
    const err = new Error("redirect");
    (err as any).options = opts;
    return err;
  },
  Link: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
}));

const syntheticBeforeLoadArgs = {
  context: {},
  location: {} as never,
  params: {},
  search: {},
  cause: "enter",
} as never;

const actions = {
  invokeBeforeLoad: () => Route.options.beforeLoad?.(syntheticBeforeLoadArgs),
};

describe("index route", () => {
  describe("given the user is authenticated", () => {
    beforeEach(() => {
      vi.mocked(getCurrentUserFn).mockResolvedValue({
        user: { id: "u1", name: "Ada", image: null },
      });
    });

    it("redirects to /profile", async () => {
      await expect(actions.invokeBeforeLoad()).rejects.toMatchObject({
        options: { to: "/profile" },
      });
    });
  });

  describe("given the user is anonymous", () => {
    beforeEach(() => {
      vi.mocked(getCurrentUserFn).mockResolvedValue({ user: null });
    });

    it("resolves without throwing", async () => {
      await expect(actions.invokeBeforeLoad()).resolves.not.toThrow();
    });
  });

  describe("given the route component is rendered", () => {
    beforeEach(() => {
      const IndexComponent = Route.options.component as ComponentType;
      render(<IndexComponent />);
    });

    it("renders the landing hero", () => {
      expect(screen.getByTestId("landing-hero")).toBeDefined();
    });

    it("renders the landing features strip", () => {
      expect(screen.getByTestId("landing-features-strip")).toBeDefined();
    });

    it("renders the landing preview card", () => {
      expect(screen.getByTestId("landing-preview-card")).toBeDefined();
    });

    it("renders the brand link to /", () => {
      expect(screen.getByRole("link", { name: "SavePoint" })).toHaveAttribute(
        "href",
        "/"
      );
    });

    it("renders the Sign in link to /login", () => {
      expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
        "href",
        "/login"
      );
    });
  });
});
