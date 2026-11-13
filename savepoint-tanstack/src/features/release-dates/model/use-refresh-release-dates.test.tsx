import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { refreshReleaseDatesFn } from "../api/refresh-release-dates";
import { useRefreshReleaseDates } from "./use-refresh-release-dates";

const routerInvalidate = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: routerInvalidate }),
}));

vi.mock("../api/refresh-release-dates", () => ({
  refreshReleaseDatesFn: vi.fn(),
}));

const refreshMock = refreshReleaseDatesFn as unknown as ReturnType<
  typeof vi.fn
>;

const actions = {
  openThePage: () => renderHook(() => useRefreshReleaseDates()),
  letPendingWorkSettle: () => new Promise((resolve) => setTimeout(resolve, 10)),
};

describe(useRefreshReleaseDates, () => {
  const unhandledRejections: unknown[] = [];
  const recordUnhandledRejection = (reason: unknown) => {
    unhandledRejections.push(reason);
  };

  beforeEach(() => {
    unhandledRejections.length = 0;
    process.on("unhandledRejection", recordUnhandledRejection);
    refreshMock.mockReset();
    routerInvalidate.mockReset();
  });

  afterEach(() => {
    process.off("unhandledRejection", recordUnhandledRejection);
  });

  describe("given the page opens and the refresh succeeds", () => {
    let hook: ReturnType<typeof actions.openThePage>;

    beforeEach(async () => {
      refreshMock.mockResolvedValue({ checked: 2, updated: 2 });
      hook = actions.openThePage();
      await actions.letPendingWorkSettle();
    });

    it("asks for a refresh exactly once", () => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });

    it("does not ask again when the page re-renders", async () => {
      hook.rerender();
      hook.rerender();
      await actions.letPendingWorkSettle();

      expect(refreshMock).toHaveBeenCalledTimes(1);
    });

    it("leaves the page as it is, without refreshing the router", () => {
      expect(routerInvalidate).not.toHaveBeenCalled();
    });
  });

  describe("given the page opens and the refresh fails", () => {
    let openingThePage: () => ReturnType<typeof actions.openThePage>;

    beforeEach(() => {
      refreshMock.mockRejectedValue(new Error("catalogue unavailable"));
      openingThePage = actions.openThePage;
    });

    it("does not throw while the page renders", () => {
      expect(() => openingThePage()).not.toThrow();
    });

    it("leaves no unhandled rejection behind", async () => {
      openingThePage();
      await actions.letPendingWorkSettle();

      expect(unhandledRejections).toEqual([]);
    });

    it("does not refresh the router", async () => {
      openingThePage();
      await actions.letPendingWorkSettle();

      expect(routerInvalidate).not.toHaveBeenCalled();
    });

    it("does not retry on a re-render", async () => {
      const hook = openingThePage();
      await actions.letPendingWorkSettle();
      hook.rerender();
      await actions.letPendingWorkSettle();

      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("given the page unmounts and mounts again", () => {
    beforeEach(async () => {
      refreshMock.mockResolvedValue({ checked: 0, updated: 0 });
      actions.openThePage().unmount();
      actions.openThePage();
      await actions.letPendingWorkSettle();
    });

    it("asks once per opening of the page", () => {
      expect(refreshMock).toHaveBeenCalledTimes(2);
    });
  });
});
