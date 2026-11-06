import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResponsiveModal } from "@/shared/ui/responsive-modal";

import { LogFollowUpsProvider } from "../../model";
import { LogForm } from "./log-form";

const mocks = vi.hoisted(() => ({
  getLoggableGamesFn: vi.fn(),
  logTimeFn: vi.fn(),
  invalidate: vi.fn(),
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => false,
  useMediaQuery: () => false,
}));
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mocks.invalidate }),
}));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/features/compose-journal-entry/api/get-loggable-games", () => ({
  getLoggableGamesFn: mocks.getLoggableGamesFn,
}));
vi.mock("@/features/compose-journal-entry/api/log-time-fn", () => ({
  logTimeFn: mocks.logTimeFn,
}));

const elements = {
  save: () =>
    within(screen.getByRole("dialog")).getByRole("button", { name: "Save" }),
  saveFooter: () =>
    // eslint-disable-next-line testing-library/no-node-access
    elements.save().closest('[data-slot="sheet-footer"]'),
  note: () => screen.getByRole("textbox", { name: "Note" }),
};

function renderInSheet() {
  render(
    <ResponsiveModal open onOpenChange={vi.fn()} title="Log time">
      <LogFollowUpsProvider value={{ markPlaying: vi.fn() }}>
        <LogForm onClose={vi.fn()} />
      </LogFollowUpsProvider>
    </ResponsiveModal>
  );
}

describe("LogForm inside the phone sheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLoggableGamesFn.mockResolvedValue([]);
    mocks.logTimeFn.mockResolvedValue({
      noteId: "note-1",
      offerMarkPlaying: false,
    });
  });

  it("saves from the sheet footer button", async () => {
    renderInSheet();
    await waitFor(() => expect(mocks.getLoggableGamesFn).toHaveBeenCalled());
    await userEvent.type(elements.note(), "Beat the first boss");

    expect(elements.saveFooter()).not.toBeNull();
    await userEvent.click(elements.save());

    await waitFor(() =>
      expect(mocks.logTimeFn).toHaveBeenCalledWith({
        data: expect.objectContaining({ content: "Beat the first boss" }),
      })
    );
  });
});
