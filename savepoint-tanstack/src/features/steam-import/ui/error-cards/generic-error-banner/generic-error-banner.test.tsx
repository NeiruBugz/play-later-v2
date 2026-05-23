import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GenericErrorBanner } from "./generic-error-banner";

const elements = {
  queryTitle: () => screen.queryByText("Something went wrong"),
  queryMessage: (m: string) => screen.queryByText(m),
  getRetryButton: () => screen.getByRole("button", { name: "Try Again" }),
  queryRetryButton: () => screen.queryByRole("button", { name: "Try Again" }),
};

describe("GenericErrorBanner", () => {
  describe("given a message and onRetry", () => {
    const onRetry = vi.fn();
    beforeEach(() => {
      onRetry.mockReset();
      render(<GenericErrorBanner message="oops" onRetry={onRetry} />);
    });

    it("renders the locked title", () => {
      expect(elements.queryTitle()).not.toBeNull();
    });

    it("renders the message verbatim", () => {
      expect(elements.queryMessage("oops")).not.toBeNull();
    });

    it("invokes onRetry when Try Again is clicked", async () => {
      await userEvent.click(elements.getRetryButton());
      expect(onRetry).toHaveBeenCalledOnce();
    });
  });

  describe("given no onRetry", () => {
    beforeEach(() => {
      render(<GenericErrorBanner message="oops" />);
    });

    it("hides the Try Again button", () => {
      expect(elements.queryRetryButton()).toBeNull();
    });
  });
});
