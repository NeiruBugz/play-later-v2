import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { acknowledgeNoticeFn } from "@/features/whats-new/api/acknowledge-notice-fn";

import { StatusModelNotice } from "./status-model-notice";

const invalidateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: invalidateMock }),
}));

vi.mock("@/features/whats-new/api/acknowledge-notice-fn", () => ({
  acknowledgeNoticeFn: vi.fn(),
}));

const elements = {
  getGotItButton: () => screen.getByRole("button", { name: "Got it" }),
  queryGotItButton: () => screen.queryByRole("button", { name: "Got it" }),
};

describe("StatusModelNotice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(acknowledgeNoticeFn).mockResolvedValue({} as never);
    render(<StatusModelNotice />);
  });

  it("explains Want, Playing, Done and Up Next", () => {
    for (const term of ["Want", "Playing", "Done", "Up Next"]) {
      expect(screen.getByText(term)).toBeInTheDocument();
    }
  });

  it("saves the acknowledgement and closes when Got it is clicked", async () => {
    await userEvent.click(elements.getGotItButton());

    await waitFor(() => expect(elements.queryGotItButton()).toBeNull());
    expect(acknowledgeNoticeFn).toHaveBeenCalledTimes(1);
    expect(invalidateMock).toHaveBeenCalled();
  });

  it("stays open with a message when saving fails", async () => {
    vi.mocked(acknowledgeNoticeFn).mockRejectedValue(new Error("boom"));

    await userEvent.click(elements.getGotItButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't save. Try again."
    );
    expect(screen.queryByText(/boom/)).toBeNull();
    expect(elements.getGotItButton()).toBeEnabled();
    expect(invalidateMock).not.toHaveBeenCalled();
  });
});
