import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { RadioGroup, RadioGroupItem } from "./radio-group";

const OPTIONS = [
  { value: "1", label: "1 h" },
  { value: "1.5", label: "1.5 h" },
  { value: "2", label: "2 h" },
];

const elements = {
  getRadio: (name: string) => screen.getByRole("radio", { name }),
  getAllRadios: () => screen.getAllByRole("radio"),
};

const actions = {
  focusRadio: (name: string) => elements.getRadio(name).focus(),
  pressKey: async (key: string) => userEvent.keyboard(key),
};

describe("RadioGroup", () => {
  describe("given three labelled options with the middle one selected", () => {
    beforeEach(() => {
      render(
        <RadioGroup defaultValue="1.5" aria-label="Evening length">
          {OPTIONS.map(({ value, label }) => (
            <label key={value}>
              <RadioGroupItem value={value} />
              {label}
            </label>
          ))}
        </RadioGroup>
      );
    });

    it("exposes each option as a radio with its label", () => {
      expect(elements.getAllRadios()).toHaveLength(3);
      expect(elements.getRadio("1 h")).toBeDefined();
      expect(elements.getRadio("1.5 h")).toBeDefined();
      expect(elements.getRadio("2 h")).toBeDefined();
    });

    it("marks only the default option as checked", () => {
      expect(elements.getRadio("1.5 h")).toHaveAttribute(
        "aria-checked",
        "true"
      );
      expect(elements.getRadio("1 h")).toHaveAttribute("aria-checked", "false");
    });

    it("moves the selection forward with the right arrow key", async () => {
      actions.focusRadio("1.5 h");
      await actions.pressKey("{ArrowRight}");
      expect(elements.getRadio("2 h")).toHaveAttribute("aria-checked", "true");
      expect(elements.getRadio("1.5 h")).toHaveAttribute(
        "aria-checked",
        "false"
      );
    });

    it("moves the selection back with the left arrow key", async () => {
      actions.focusRadio("1.5 h");
      await actions.pressKey("{ArrowLeft}");
      expect(elements.getRadio("1 h")).toHaveAttribute("aria-checked", "true");
    });
  });
});
