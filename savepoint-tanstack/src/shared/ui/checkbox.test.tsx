import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Checkbox } from "./checkbox";

const elements = {
  getCheckbox: () => screen.getByRole("checkbox"),
};

const actions = {
  clickCheckbox: async () => userEvent.click(elements.getCheckbox()),
  pressSpace: async () => {
    elements.getCheckbox().focus();
    await userEvent.keyboard(" ");
  },
};

describe("Checkbox", () => {
  describe("given uncontrolled mode with defaultChecked=false", () => {
    beforeEach(() => {
      render(<Checkbox />);
    });

    it("renders with aria-checked='false'", () => {
      expect(elements.getCheckbox()).toHaveAttribute("aria-checked", "false");
    });

    it("toggles to aria-checked='true' after a click", async () => {
      await actions.clickCheckbox();
      expect(elements.getCheckbox()).toHaveAttribute("aria-checked", "true");
    });

    it("toggles back to aria-checked='false' on a second click", async () => {
      await actions.clickCheckbox();
      await actions.clickCheckbox();
      expect(elements.getCheckbox()).toHaveAttribute("aria-checked", "false");
    });
  });

  describe("given uncontrolled mode with defaultChecked=true", () => {
    beforeEach(() => {
      render(<Checkbox defaultChecked />);
    });

    it("renders with aria-checked='true' initially", () => {
      expect(elements.getCheckbox()).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("given controlled mode with checked=true", () => {
    beforeEach(() => {
      render(<Checkbox checked onCheckedChange={() => {}} />);
    });

    it("renders with aria-checked='true'", () => {
      expect(elements.getCheckbox()).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("given controlled mode with checked=false", () => {
    beforeEach(() => {
      render(<Checkbox checked={false} onCheckedChange={() => {}} />);
    });

    it("renders with aria-checked='false'", () => {
      expect(elements.getCheckbox()).toHaveAttribute("aria-checked", "false");
    });
  });

  describe("given an onCheckedChange handler", () => {
    it("calls onCheckedChange with the new checked value when clicked", async () => {
      const onCheckedChange = vi.fn();
      render(<Checkbox onCheckedChange={onCheckedChange} />);

      await actions.clickCheckbox();
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  describe("given keyboard interaction", () => {
    it("toggles aria-checked when Space is pressed", async () => {
      render(<Checkbox />);

      await actions.pressSpace();
      expect(elements.getCheckbox()).toHaveAttribute("aria-checked", "true");
    });
  });
});
