import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NavigationProgress } from "./navigation-progress";

let mockIsPending = false;

vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ status: mockIsPending ? "pending" : "idle" }),
}));

const elements = {
  queryProgressBar: () => screen.queryByRole("progressbar"),
  getProgressBar: () => screen.getByRole("progressbar"),
};

const actions = {
  waitFor: (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms)),
};

describe("NavigationProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockIsPending = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given no navigation is pending", () => {
    beforeEach(() => {
      render(<NavigationProgress />);
    });

    it("shows no progress bar", () => {
      expect(elements.queryProgressBar()).toBeNull();
    });
  });

  describe("given a navigation has just started", () => {
    beforeEach(async () => {
      mockIsPending = true;
      render(<NavigationProgress />);
      await actions.waitFor(100);
    });

    it("stays hidden so quick navigations do not flicker", () => {
      expect(elements.queryProgressBar()).toBeNull();
    });
  });

  describe("given a navigation stays pending past the threshold", () => {
    beforeEach(async () => {
      mockIsPending = true;
      render(<NavigationProgress />);
      await actions.waitFor(200);
    });

    it("shows a busy progress bar", () => {
      expect(elements.getProgressBar()).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("given the pending navigation finishes", () => {
    beforeEach(async () => {
      mockIsPending = true;
      const view = render(<NavigationProgress />);
      await actions.waitFor(200);
      mockIsPending = false;
      view.rerender(<NavigationProgress />);
      await actions.waitFor(1000);
    });

    it("removes the progress bar", () => {
      expect(elements.queryProgressBar()).toBeNull();
    });
  });
});
