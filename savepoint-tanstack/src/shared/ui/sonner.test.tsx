import { act, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it } from "vitest";

import { ThemeContext } from "@/shared/lib/theme";

import { Toaster } from "./sonner";

const elements = {
  getToaster: () => screen.getByRole("list"),
};

const actions = {
  showToast: async (message: string) => {
    act(() => {
      toast(message);
    });
    await screen.findByText(message);
  },
};

describe("Toaster", () => {
  describe("given the user's theme is system and it resolves to dark", () => {
    beforeEach(async () => {
      render(
        <ThemeContext.Provider
          value={{ theme: "system", resolvedTheme: "dark", setTheme: () => {} }}
        >
          <Toaster />
        </ThemeContext.Provider>
      );
      await actions.showToast("Saved");
    });

    it("renders the toaster with the dark theme", () => {
      expect(elements.getToaster()).toHaveAttribute(
        "data-sonner-theme",
        "dark"
      );
    });
  });
});
