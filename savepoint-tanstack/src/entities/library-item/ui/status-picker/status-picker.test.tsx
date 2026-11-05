import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StatusPicker } from "./status-picker";

const isDesktopMock = vi.hoisted(() => vi.fn());
vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: isDesktopMock,
}));

const onSelect = vi.fn();

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <StatusPicker
      value="WANT"
      onSelect={onSelect}
      open={open}
      onOpenChange={setOpen}
      trigger={<button type="button">Change status</button>}
    />
  );
}

const elements = {
  getTrigger: () => screen.getByRole("button", { name: "Change status" }),
  getGroup: () => screen.getByRole("radiogroup", { name: "Set status" }),
  queryGroup: () => screen.queryByRole("radiogroup"),
  getRadio: (name: string) => screen.getByRole("radio", { name }),
  getRadios: () => screen.getAllByRole("radio"),
};

const actions = {
  openPicker: () => userEvent.click(elements.getTrigger()),
  clickOption: (name: string) => userEvent.click(elements.getRadio(name)),
};

describe.each([
  ["desktop", true],
  ["phone", false],
])("StatusPicker on %s", (_, isDesktop) => {
  beforeEach(() => {
    onSelect.mockClear();
    isDesktopMock.mockReturnValue(isDesktop);
    render(<Harness />);
  });

  describe("given the picker is closed", () => {
    it("shows no options", () => {
      expect(elements.queryGroup()).not.toBeInTheDocument();
    });
  });

  describe("when the trigger is clicked", () => {
    beforeEach(async () => {
      await actions.openPicker();
    });

    it("offers Want, Playing and Done as radios with the current one checked", () => {
      expect(elements.getRadios().map((r) => r.textContent)).toEqual([
        "Want",
        "Playing",
        "Done",
      ]);
      expect(elements.getRadio("Want")).toHaveAttribute("aria-checked", "true");
      expect(elements.getRadio("Done")).toHaveAttribute(
        "aria-checked",
        "false"
      );
    });

    it("puts focus on the current option", () => {
      expect(elements.getRadio("Want")).toHaveFocus();
    });
  });

  describe("when an option is clicked", () => {
    beforeEach(async () => {
      await actions.openPicker();
      await actions.clickOption("Done");
    });

    it("reports the choice immediately and closes", () => {
      expect(onSelect).toHaveBeenCalledExactlyOnceWith("DONE");
      expect(elements.queryGroup()).not.toBeInTheDocument();
    });
  });

  describe("when arrow keys and Enter are used", () => {
    beforeEach(async () => {
      await actions.openPicker();
      await userEvent.keyboard("{ArrowDown}");
    });

    it("moves focus without selecting", () => {
      expect(elements.getRadio("Playing")).toHaveFocus();
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("wraps around at the ends", async () => {
      await userEvent.keyboard("{ArrowDown}{ArrowDown}");
      expect(elements.getRadio("Want")).toHaveFocus();
    });

    it("selects the focused option on Enter", async () => {
      await userEvent.keyboard("{Enter}");
      expect(onSelect).toHaveBeenCalledExactlyOnceWith("PLAYING");
    });

    it("selects the focused option on Space", async () => {
      await userEvent.keyboard(" ");
      expect(onSelect).toHaveBeenCalledExactlyOnceWith("PLAYING");
    });
  });

  describe("when Escape is pressed", () => {
    beforeEach(async () => {
      await actions.openPicker();
      await userEvent.keyboard("{Escape}");
    });

    it("closes without selecting and returns focus to the trigger", () => {
      expect(elements.queryGroup()).not.toBeInTheDocument();
      expect(onSelect).not.toHaveBeenCalled();
      expect(elements.getTrigger()).toHaveFocus();
    });
  });
});
