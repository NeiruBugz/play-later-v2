import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ViewModeToggle } from "./view-mode-toggle";

const onViewModeChange = vi.fn();

const elements = {
  getGrid: () => screen.getByRole("button", { name: "Grid view" }),
  getList: () => screen.getByRole("button", { name: "List view" }),
};

describe("ViewModeToggle", () => {
  beforeEach(() => {
    onViewModeChange.mockClear();
  });

  describe("given the grid view is active", () => {
    beforeEach(() => {
      render(
        <ViewModeToggle viewMode="grid" onViewModeChange={onViewModeChange} />
      );
    });

    it("marks Grid view as pressed and List view as not pressed", () => {
      expect(elements.getGrid()).toHaveAttribute("aria-pressed", "true");
      expect(elements.getList()).toHaveAttribute("aria-pressed", "false");
    });

    it("reports 'list' when List view is clicked", async () => {
      await userEvent.click(elements.getList());
      expect(onViewModeChange).toHaveBeenCalledWith("list");
    });
  });

  describe("given the list view is active", () => {
    beforeEach(() => {
      render(
        <ViewModeToggle viewMode="list" onViewModeChange={onViewModeChange} />
      );
    });

    it("reports 'grid' when Grid view is clicked", async () => {
      await userEvent.click(elements.getGrid());
      expect(onViewModeChange).toHaveBeenCalledWith("grid");
    });
  });
});
