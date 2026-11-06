import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResponsiveModal } from "./responsive-modal";

const mocks = vi.hoisted(() => ({ isDesktop: true }));

vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => mocks.isDesktop,
  useMediaQuery: () => mocks.isDesktop,
}));

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open modal
      </button>
      <ResponsiveModal open={open} onOpenChange={setOpen} title="Log time">
        <p>Modal body</p>
      </ResponsiveModal>
    </>
  );
}

const BACKDROP_SELECTOR = ":scope > [role='presentation'][data-open]";

const elements = {
  getTrigger: () =>
    screen.getByRole("button", { name: "Open modal", hidden: true }),
  findDialog: () => screen.findByRole("dialog"),
  queryDialog: () => screen.queryByRole("dialog"),
  getBackdrop: () => {
    // eslint-disable-next-line testing-library/no-node-access
    const popupContainer = screen.getByRole("dialog").parentElement;
    // eslint-disable-next-line testing-library/no-node-access
    const backdrop = popupContainer?.querySelector(BACKDROP_SELECTOR);
    if (!backdrop) throw new Error("backdrop not rendered");
    return backdrop;
  },
};

const actions = {
  open: () => userEvent.click(elements.getTrigger()),
  pressBackdrop: () => userEvent.click(elements.getBackdrop()),
  pressEscape: () => userEvent.keyboard("{Escape}"),
};

describe.each([
  { name: "dialog", isDesktop: true },
  { name: "sheet", isDesktop: false },
])("ResponsiveModal as a $name", ({ isDesktop }) => {
  beforeEach(async () => {
    mocks.isDesktop = isDesktop;
    render(<Harness />);
    await actions.open();
    await elements.findDialog();
  });

  describe("when the user presses the backdrop", () => {
    beforeEach(async () => {
      await actions.pressBackdrop();
    });

    it("closes", async () => {
      await waitFor(() => expect(elements.queryDialog()).toBeNull());
    });
  });

  describe("when the user presses Escape", () => {
    beforeEach(async () => {
      await actions.pressEscape();
    });

    it("closes", async () => {
      await waitFor(() => expect(elements.queryDialog()).toBeNull());
    });

    it("returns focus to the trigger that opened it", async () => {
      await waitFor(() => expect(elements.getTrigger()).toHaveFocus());
    });
  });
});

describe("ResponsiveModal as a sheet with body content", () => {
  beforeEach(async () => {
    mocks.isDesktop = false;
    render(<Harness />);
    await actions.open();
    await elements.findDialog();
  });

  // jsdom computes no layout, so the inset is asserted as the class the popup
  // carries; real layout is verified in the browser.
  it("insets the body from the left and right edges", () => {
    expect(elements.queryDialog()).toHaveClass("px-6");
  });
});
