import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  showSyncCompletedToast,
  showSyncFailedToast,
  showSyncStartedToast,
} from "./import-status-feedback";

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("import-status-feedback", () => {
  beforeEach(() => {
    vi.mocked(toast.info).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  describe("showSyncStartedToast", () => {
    beforeEach(() => {
      showSyncStartedToast();
    });

    it("fires toast.info with the locked title", () => {
      expect(vi.mocked(toast.info)).toHaveBeenCalledWith(
        "Steam library sync started",
        expect.objectContaining({ duration: 5000 })
      );
    });
  });

  describe("showSyncCompletedToast", () => {
    beforeEach(() => {
      showSyncCompletedToast(3);
    });

    it("fires toast.success with the game count in the description", () => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
        "Steam library sync completed",
        expect.objectContaining({
          description: "3 games imported successfully.",
        })
      );
    });
  });

  describe("showSyncCompletedToast with 1 game", () => {
    beforeEach(() => {
      showSyncCompletedToast(1);
    });

    it("pluralizes correctly for the singular case", () => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
        "Steam library sync completed",
        expect.objectContaining({
          description: "1 game imported successfully.",
        })
      );
    });
  });

  describe("showSyncFailedToast", () => {
    beforeEach(() => {
      showSyncFailedToast("upstream-fail");
    });

    it("fires toast.error with the supplied message in the description", () => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "Steam library sync failed",
        expect.objectContaining({ description: "upstream-fail" })
      );
    });
  });
});
