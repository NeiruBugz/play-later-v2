import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Route } from "./index";

vi.mock("@/widgets/landing-hero", () => ({
  LandingHero: () => <div data-testid="landing-hero" />,
}));

vi.mock("@/widgets/landing-features", () => ({
  LandingFeaturesStrip: () => <div data-testid="landing-features-strip" />,
  LandingPreviewCard: () => <div data-testid="landing-preview-card" />,
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

const beforeLoadWith = (user: unknown) =>
  Route.options.beforeLoad?.({
    context: { user },
    location: {} as never,
    params: {},
    search: {},
    cause: "enter",
  } as never);

describe("index route", () => {
  describe("given the user is authenticated", () => {
    it("redirects to /dashboard", () => {
      expect(() => beforeLoadWith({ id: "u1", username: "ada" })).toThrowError(
        expect.objectContaining({ options: { to: "/dashboard" } })
      );
    });
  });

  describe("given the user is anonymous", () => {
    it("lets the landing page render", () => {
      expect(() => beforeLoadWith(null)).not.toThrow();
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
