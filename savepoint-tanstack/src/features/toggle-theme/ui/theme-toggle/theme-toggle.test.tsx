import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import {
  SavepointThemeProvider,
  type Theme,
} from "@/app/providers/theme-provider";

import { ThemeToggle } from "./theme-toggle";

// Theme value → CSS class mapping (value === class name):
//   light     → "" (no class)
//   dark      → "dark"
//   cartridge → "cartridge"
//   aurora    → "aurora"
//   system    → resolved via prefers-color-scheme

function Harness({ defaultTheme = "system" }: { defaultTheme?: Theme }) {
  return (
    <SavepointThemeProvider defaultTheme={defaultTheme}>
      <ThemeToggle />
    </SavepointThemeProvider>
  );
}

const elements = {
  getTrigger: () => screen.getByRole("button", { name: "Change theme" }),
  getOptionButton: (label: string) =>
    screen.getByRole("menuitem", { name: label }),
  queryOptionButton: (label: string) =>
    screen.queryByRole("menuitem", { name: label }),
};

const actions = {
  openPicker: async () => {
    await userEvent.click(elements.getTrigger());
  },
  selectOption: async (label: string) => {
    await userEvent.click(elements.getOptionButton(label));
  },
  pressKey: async (key: string) => {
    await userEvent.keyboard(key);
  },
  clickOutside: async () => {
    await userEvent.click(document.body);
  },
};

describe("ThemeToggle", () => {
  describe("given initial mount with no stored theme (system default)", () => {
    beforeEach(() => {
      render(<Harness defaultTheme="system" />);
    });

    it("renders the trigger labelled 'Change theme' (system default)", () => {
      expect(elements.getTrigger()).toBeInTheDocument();
    });

    it("does not show any option buttons before the picker is opened", () => {
      expect(elements.queryOptionButton("Light")).toBeNull();
      expect(elements.queryOptionButton("Dark")).toBeNull();
      expect(elements.queryOptionButton("Cartridge")).toBeNull();
      expect(elements.queryOptionButton("Aurora")).toBeNull();
      expect(elements.queryOptionButton("System")).toBeNull();
    });
  });

  describe("given the trigger is clicked", () => {
    beforeEach(async () => {
      render(<Harness defaultTheme="system" />);
      await actions.openPicker();
    });

    it("shows the Light option button", () => {
      expect(elements.getOptionButton("Light")).toBeInTheDocument();
    });

    it("shows the Dark option button", () => {
      expect(elements.getOptionButton("Dark")).toBeInTheDocument();
    });

    it("shows the Cartridge option button", () => {
      expect(elements.getOptionButton("Cartridge")).toBeInTheDocument();
    });

    it("shows the Aurora option button", () => {
      expect(elements.getOptionButton("Aurora")).toBeInTheDocument();
    });

    it("shows the System option button", () => {
      expect(elements.getOptionButton("System")).toBeInTheDocument();
    });
  });

  describe("given the user selects Dark", () => {
    beforeEach(async () => {
      render(<Harness defaultTheme="system" />);
      await actions.openPicker();
      await actions.selectOption("Dark");
    });

    it("closes the picker after selection", () => {
      expect(elements.queryOptionButton("Dark")).toBeNull();
    });

    it("keeps the trigger present after selection", () => {
      // aria-label stays "Change theme" — the icon swap is purely visual.
      expect(elements.getTrigger()).toBeInTheDocument();
    });
  });

  describe("given the user selects Light", () => {
    beforeEach(async () => {
      render(<Harness defaultTheme="system" />);
      await actions.openPicker();
      await actions.selectOption("Light");
    });

    it("closes the picker after selection", () => {
      expect(elements.queryOptionButton("Light")).toBeNull();
    });
  });

  describe("given the user selects Cartridge", () => {
    beforeEach(async () => {
      render(<Harness defaultTheme="system" />);
      await actions.openPicker();
      await actions.selectOption("Cartridge");
    });

    it("closes the picker after selection", () => {
      expect(elements.queryOptionButton("Cartridge")).toBeNull();
    });
  });

  describe("given the user selects Aurora", () => {
    beforeEach(async () => {
      render(<Harness defaultTheme="system" />);
      await actions.openPicker();
      await actions.selectOption("Aurora");
    });

    it("closes the picker after selection", () => {
      expect(elements.queryOptionButton("Aurora")).toBeNull();
    });
  });

  describe("given Escape is pressed while the picker is open", () => {
    beforeEach(async () => {
      render(<Harness defaultTheme="system" />);
      await actions.openPicker();
      await actions.pressKey("{Escape}");
    });

    it("closes the picker", () => {
      expect(elements.queryOptionButton("Light")).toBeNull();
    });
  });

  describe("given a click outside the picker while it is open", () => {
    beforeEach(async () => {
      render(<Harness defaultTheme="system" />);
      await actions.openPicker();
      await actions.clickOutside();
    });

    it("closes the picker", () => {
      expect(elements.queryOptionButton("Light")).toBeNull();
    });
  });

  describe("given the trigger is focused and ArrowDown is pressed", () => {
    beforeEach(async () => {
      render(<Harness defaultTheme="system" />);
      elements.getTrigger().focus();
      await actions.pressKey("{ArrowDown}");
    });

    it("opens the picker and moves focus into the menu", () => {
      // Radix DropdownMenu opens on ArrowDown from the trigger and focuses
      // the first menuitem — that's the user-observable arrow-key contract.
      const firstItem = elements.getOptionButton("Light");
      expect(firstItem).toHaveFocus();
    });
  });

  describe("given dark theme is stored in localStorage", () => {
    beforeEach(() => {
      localStorage.setItem("theme", "dark");
      render(<Harness defaultTheme="dark" />);
    });

    it("renders the trigger (persistence acknowledged by defaultTheme prop)", () => {
      expect(elements.getTrigger()).toBeInTheDocument();
    });
  });
});
