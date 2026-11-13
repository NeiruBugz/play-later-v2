import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeviceToday } from "./use-device-today";

function TodayProbe() {
  return <p>{useDeviceToday()}</p>;
}

const actions = {
  setDeviceClock: (now: Date) => {
    vi.setSystemTime(now);
  },
  returnToTheTab: () => {
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
  },
};

describe(useDeviceToday, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given the page is rendered on the server late on 12 Nov UTC", () => {
    let renderedPage: string;

    beforeEach(() => {
      actions.setDeviceClock(new Date(Date.UTC(2026, 10, 12, 23, 30)));
      renderedPage = renderToString(<TodayProbe />);
    });

    it("reads the UTC day", () => {
      expect(renderedPage).toContain("<p>2026-11-12</p>");
    });
  });

  describe.each([
    ["early in the morning", new Date(2026, 10, 12, 1, 30)],
    ["late in the evening", new Date(2026, 10, 12, 23, 30)],
  ])("given a device clock reading 12 Nov %s", (_when, now) => {
    let today: () => string;

    beforeEach(() => {
      actions.setDeviceClock(now);
      const { result } = renderHook(() => useDeviceToday());
      today = () => result.current;
    });

    it("reads the day on the device, not the UTC day", () => {
      expect(today()).toBe("2026-11-12");
    });
  });

  describe("given a tab left open past midnight", () => {
    let today: () => string;

    beforeEach(() => {
      actions.setDeviceClock(new Date(2026, 10, 12, 23, 30));
      const { result } = renderHook(() => useDeviceToday());
      today = () => result.current;
      actions.setDeviceClock(new Date(2026, 10, 13, 0, 30));
    });

    describe("when the person comes back to the tab", () => {
      beforeEach(() => {
        actions.returnToTheTab();
      });

      it("reads the new day", () => {
        expect(today()).toBe("2026-11-13");
      });
    });
  });
});
