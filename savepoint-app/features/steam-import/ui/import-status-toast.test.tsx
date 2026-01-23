import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import {
  showImportStatusToast,
  showSyncAlreadyInProgressToast,
  showSyncCompletedToast,
  showSyncFailedToast,
  showSyncStartedToast,
} from "./import-status-toast";

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("ImportStatusToast", () => {
  describe("showSyncStartedToast", () => {
    it("should show info toast with default message", () => {
      showSyncStartedToast();

      expect(toast.info).toHaveBeenCalledWith("Steam library sync started", {
        description:
          "This may take a few minutes. We'll notify you when it's complete.",
        duration: 5000,
      });
    });

    it("should show info toast with custom description", () => {
      showSyncStartedToast({ description: "Custom message" });

      expect(toast.info).toHaveBeenCalledWith("Steam library sync started", {
        description: "Custom message",
        duration: 5000,
      });
    });

    it("should show info toast with custom duration", () => {
      showSyncStartedToast({ duration: 3000 });

      expect(toast.info).toHaveBeenCalledWith("Steam library sync started", {
        description:
          "This may take a few minutes. We'll notify you when it's complete.",
        duration: 3000,
      });
    });
  });

  describe("showSyncCompletedToast", () => {
    it("should show success toast with singular game label", () => {
      showSyncCompletedToast(1);

      expect(toast.success).toHaveBeenCalledWith(
        "Steam library sync completed",
        {
          description: "1 game imported successfully.",
          duration: 5000,
        }
      );
    });

    it("should show success toast with plural game label", () => {
      showSyncCompletedToast(10);

      expect(toast.success).toHaveBeenCalledWith(
        "Steam library sync completed",
        {
          description: "10 games imported successfully.",
          duration: 5000,
        }
      );
    });

    it("should show success toast with custom description", () => {
      showSyncCompletedToast(5, { description: "All done!" });

      expect(toast.success).toHaveBeenCalledWith(
        "Steam library sync completed",
        {
          description: "All done!",
          duration: 5000,
        }
      );
    });

    it("should show success toast with zero games", () => {
      showSyncCompletedToast(0);

      expect(toast.success).toHaveBeenCalledWith(
        "Steam library sync completed",
        {
          description: "0 games imported successfully.",
          duration: 5000,
        }
      );
    });
  });

  describe("showSyncFailedToast", () => {
    it("should show error toast with default message", () => {
      showSyncFailedToast();

      expect(toast.error).toHaveBeenCalledWith("Steam library sync failed", {
        description:
          "Please try again or contact support if the issue persists.",
        duration: 6000,
      });
    });

    it("should show error toast with custom error message", () => {
      showSyncFailedToast("Connection timeout");

      expect(toast.error).toHaveBeenCalledWith("Steam library sync failed", {
        description: "Connection timeout",
        duration: 6000,
      });
    });

    it("should show error toast with custom description option", () => {
      showSyncFailedToast(undefined, {
        description: "Something went wrong",
      });

      expect(toast.error).toHaveBeenCalledWith("Steam library sync failed", {
        description: "Something went wrong",
        duration: 6000,
      });
    });

    it("should prioritize errorMessage over options.description", () => {
      showSyncFailedToast("Priority message", {
        description: "Should be ignored",
      });

      expect(toast.error).toHaveBeenCalledWith("Steam library sync failed", {
        description: "Priority message",
        duration: 6000,
      });
    });
  });

  describe("showSyncAlreadyInProgressToast", () => {
    it("should show warning toast with default message", () => {
      showSyncAlreadyInProgressToast();

      expect(toast.warning).toHaveBeenCalledWith("Sync already in progress", {
        description:
          "A Steam library sync is currently running. Please wait for it to complete.",
        duration: 4000,
      });
    });

    it("should show warning toast with custom description", () => {
      showSyncAlreadyInProgressToast({ description: "Please wait" });

      expect(toast.warning).toHaveBeenCalledWith("Sync already in progress", {
        description: "Please wait",
        duration: 4000,
      });
    });
  });

  describe("showImportStatusToast", () => {
    it("should show info toast by default", () => {
      showImportStatusToast("Custom message");

      expect(toast.info).toHaveBeenCalledWith("Custom message", {
        description: undefined,
        duration: 5000,
      });
    });

    it("should show success toast when variant is success", () => {
      showImportStatusToast("Success message", "success");

      expect(toast.success).toHaveBeenCalledWith("Success message", {
        description: undefined,
        duration: 5000,
      });
    });

    it("should show error toast when variant is error", () => {
      showImportStatusToast("Error message", "error");

      expect(toast.error).toHaveBeenCalledWith("Error message", {
        description: undefined,
        duration: 5000,
      });
    });

    it("should show warning toast when variant is warning", () => {
      showImportStatusToast("Warning message", "warning");

      expect(toast.warning).toHaveBeenCalledWith("Warning message", {
        description: undefined,
        duration: 5000,
      });
    });

    it("should pass through custom options", () => {
      showImportStatusToast("Message", "info", {
        description: "Details",
        duration: 3000,
      });

      expect(toast.info).toHaveBeenCalledWith("Message", {
        description: "Details",
        duration: 3000,
      });
    });
  });
});
