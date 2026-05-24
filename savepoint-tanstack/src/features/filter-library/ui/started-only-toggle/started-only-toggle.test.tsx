import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartedOnlyToggle } from "./started-only-toggle";

const onCheckedChange = vi.fn();

const elements = {
  getSwitch: () => screen.getByRole("switch", { name: "Hide untouched games" }),
};

const actions = {
  toggle: () => userEvent.click(elements.getSwitch()),
};

describe("StartedOnlyToggle", () => {
  beforeEach(() => {
    onCheckedChange.mockReset();
  });

  describe("given the toggle is off", () => {
    beforeEach(() => {
      render(
        <StartedOnlyToggle checked={false} onCheckedChange={onCheckedChange} />
      );
    });

    it("turns on when clicked", async () => {
      await actions.toggle();
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  describe("given the toggle is on", () => {
    beforeEach(() => {
      render(
        <StartedOnlyToggle checked={true} onCheckedChange={onCheckedChange} />
      );
    });

    it("reflects the checked state", () => {
      expect(elements.getSwitch()).toBeChecked();
    });
  });
});
