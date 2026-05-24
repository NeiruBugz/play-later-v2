import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AcquisitionList } from "./acquisition-list";

const onPick = vi.fn();

const elements = {
  getOption: (label: string) =>
    screen.getByRole("button", { name: `Filter by ${label}` }),
  getActiveClearOption: (label: string) =>
    screen.getByRole("button", { name: `Clear ${label} filter` }),
};

const actions = {
  pick: (label: string) => userEvent.click(elements.getOption(label)),
};

describe("AcquisitionList", () => {
  beforeEach(() => {
    onPick.mockReset();
  });

  describe("given the sidebar variant with nothing selected", () => {
    beforeEach(() => {
      render(
        <AcquisitionList
          current={undefined}
          onPick={onPick}
          variant="sidebar"
        />
      );
    });

    it("renders the three acquisition options", () => {
      expect(elements.getOption("Owned")).toBeDefined();
      expect(elements.getOption("Subscription")).toBeDefined();
      expect(elements.getOption("Physical")).toBeDefined();
    });

    it("emits the picked enum value", async () => {
      await actions.pick("Subscription");
      expect(onPick).toHaveBeenCalledWith("SUBSCRIPTION");
    });
  });

  describe("given a value is already active (sheet variant)", () => {
    beforeEach(() => {
      render(
        <AcquisitionList current="PHYSICAL" onPick={onPick} variant="sheet" />
      );
    });

    it("marks the active option pressed and exposes a clear affordance", () => {
      expect(elements.getActiveClearOption("Physical")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });
  });
});
