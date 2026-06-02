import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMutationAction } from "./use-mutation-action";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const invalidateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: invalidateMock }),
}));

const mutationFn = vi.fn();
const onResolved = vi.fn();

type HarnessProps = {
  successMessage?: string;
  errorFallback?: string;
  invalidate?: boolean;
  omitSuccessMessage?: boolean;
};

function Harness({
  successMessage = "Saved",
  errorFallback = "Something went wrong",
  invalidate,
  omitSuccessMessage = false,
}: HarnessProps) {
  const { pending, run } = useMutationAction();

  const handleClick = async () => {
    const result = await run(() => mutationFn(), {
      ...(omitSuccessMessage ? {} : { successMessage }),
      errorFallback,
      ...(invalidate !== undefined ? { invalidate } : {}),
    });
    if (result !== undefined) onResolved(result);
  };

  return (
    <button type="button" onClick={handleClick} disabled={pending}>
      {pending ? "Working" : "Run"}
    </button>
  );
}

const elements = {
  getRunButton: () => screen.getByRole("button", { name: "Run" }),
  queryWorkingButton: () => screen.queryByRole("button", { name: "Working" }),
};

const actions = {
  clickRun: () => userEvent.click(elements.getRunButton()),
};

describe("useMutationAction", () => {
  beforeEach(() => {
    mutationFn.mockReset();
    onResolved.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
    invalidateMock.mockReset();
  });

  describe("given the mutation resolves", () => {
    beforeEach(async () => {
      mutationFn.mockResolvedValue({ id: "item-1" });
      render(<Harness successMessage="Item saved" />);
      await actions.clickRun();
    });

    it("fires the configured success toast", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Item saved");
      });
    });

    it("invalidates the router by default", async () => {
      await waitFor(() => {
        expect(invalidateMock).toHaveBeenCalledOnce();
      });
    });

    it("resolves the runner with the fn result", async () => {
      await waitFor(() => {
        expect(onResolved).toHaveBeenCalledWith({ id: "item-1" });
      });
    });

    it("does not fire an error toast", () => {
      expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
    });

    it("clears the pending state after completion", async () => {
      await waitFor(() => {
        expect(elements.queryWorkingButton()).toBeNull();
      });
    });
  });

  describe("given the mutation rejects with an Error", () => {
    beforeEach(async () => {
      mutationFn.mockRejectedValue(new Error("rate-limited"));
      render(<Harness errorFallback="Could not save" />);
      await actions.clickRun();
    });

    it("fires toast.error with the mapped err.message", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith("rate-limited");
      });
    });

    it("does not fire a success toast", () => {
      expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
    });

    it("does not invalidate the router", () => {
      expect(invalidateMock).not.toHaveBeenCalled();
    });

    it("does not fire the post-success callback", () => {
      expect(onResolved).not.toHaveBeenCalled();
    });
  });

  describe("given the mutation rejects with a non-Error value", () => {
    beforeEach(async () => {
      mutationFn.mockRejectedValue("boom");
      render(<Harness errorFallback="Could not save" />);
      await actions.clickRun();
    });

    it("toasts the configured fallback message", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Could not save");
      });
    });
  });

  describe("given invalidate is set to false", () => {
    beforeEach(async () => {
      mutationFn.mockResolvedValue(undefined);
      render(<Harness invalidate={false} />);
      await actions.clickRun();
    });

    it("does not invalidate the router", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalled();
      });
      expect(invalidateMock).not.toHaveBeenCalled();
    });
  });

  describe("given an onSuccess callback and a void-resolving mutation", () => {
    const onSuccessSpy = vi.fn();

    beforeEach(async () => {
      onSuccessSpy.mockReset();
      mutationFn.mockResolvedValue(undefined);

      function VoidHarness() {
        const { run } = useMutationAction();
        return (
          <button
            type="button"
            onClick={() =>
              void run(() => mutationFn(), {
                successMessage: "Done",
                errorFallback: "Failed",
                onSuccess: onSuccessSpy,
              })
            }
          >
            Run
          </button>
        );
      }

      render(<VoidHarness />);
      await actions.clickRun();
    });

    it("fires onSuccess even when the mutation resolves undefined", async () => {
      await waitFor(() => {
        expect(onSuccessSpy).toHaveBeenCalledOnce();
      });
    });
  });

  describe("given an onSuccess callback and a rejecting mutation", () => {
    const onSuccessSpy = vi.fn();

    beforeEach(async () => {
      onSuccessSpy.mockReset();
      mutationFn.mockRejectedValue(new Error("nope"));

      function VoidHarness() {
        const { run } = useMutationAction();
        return (
          <button
            type="button"
            onClick={() =>
              void run(() => mutationFn(), {
                successMessage: "Done",
                errorFallback: "Failed",
                onSuccess: onSuccessSpy,
              })
            }
          >
            Run
          </button>
        );
      }

      render(<VoidHarness />);
      await actions.clickRun();
    });

    it("does not fire onSuccess on the error path", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalled();
      });
      expect(onSuccessSpy).not.toHaveBeenCalled();
    });
  });

  describe("given no successMessage is provided", () => {
    beforeEach(async () => {
      mutationFn.mockResolvedValue(undefined);
      render(<Harness omitSuccessMessage />);
      await actions.clickRun();
    });

    it("does not fire a success toast", async () => {
      await waitFor(() => {
        expect(invalidateMock).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
    });
  });
});
