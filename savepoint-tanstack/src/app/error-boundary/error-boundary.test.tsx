import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  UpstreamError,
  ValidationError,
} from "@/shared/lib/errors";

import { ErrorBoundary } from "./error-boundary";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
}));

const elements = {
  getAlert: () => screen.getByRole("alert"),
  getHeading: () => screen.getByRole("heading", { level: 1 }),
  querySignInLink: () => screen.queryByRole("link", { name: "Sign in" }),
  getHomeLink: () => screen.getByRole("link", { name: "Go home" }),
};

describe("ErrorBoundary", () => {
  describe("given a NotFoundError", () => {
    beforeEach(() => {
      render(<ErrorBoundary error={new NotFoundError("missing", {})} />);
    });

    it("renders the 'Not found' heading", () => {
      expect(elements.getHeading().textContent).toBe("Not found");
    });

    it("renders an alert-role container", () => {
      expect(elements.getAlert()).toBeDefined();
    });

    it("renders the 'Go home' link to /", () => {
      expect(elements.getHomeLink()).toHaveAttribute("href", "/");
    });

    it("does NOT render the sign-in link", () => {
      expect(elements.querySignInLink()).toBeNull();
    });
  });

  describe("given an UnauthorizedError", () => {
    beforeEach(() => {
      render(<ErrorBoundary error={new UnauthorizedError("sign in")} />);
    });

    it("renders the 'Sign in required' heading", () => {
      expect(elements.getHeading().textContent).toBe("Sign in required");
    });

    it("renders the sign-in link to /login", () => {
      expect(elements.querySignInLink()).toHaveAttribute("href", "/login");
    });
  });

  describe.each([
    ["ConflictError", new ConflictError("conflict", {})],
    ["ValidationError", new ValidationError("invalid", {})],
    ["UpstreamError", new UpstreamError("upstream", {})],
  ])("given a %s", (_name, err) => {
    beforeEach(() => {
      render(<ErrorBoundary error={err} />);
    });

    it("renders the generic 'Something went wrong' heading", () => {
      expect(elements.getHeading().textContent).toBe("Something went wrong");
    });

    it("does NOT render the sign-in link", () => {
      expect(elements.querySignInLink()).toBeNull();
    });
  });

  describe("given a non-AppError Error", () => {
    beforeEach(() => {
      render(<ErrorBoundary error={new Error("boom")} />);
    });

    it("renders the 'Unexpected error' heading", () => {
      expect(elements.getHeading().textContent).toBe("Unexpected error");
    });
  });
});
