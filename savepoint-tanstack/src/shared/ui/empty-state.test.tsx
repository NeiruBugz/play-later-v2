import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmptyState } from "./empty-state";

const elements = {
  getHeading: () => screen.getByRole("heading", { name: "Nothing here yet" }),
  queryHeading: () =>
    screen.queryByRole("heading", { name: "Nothing here yet" }),
  queryDescription: () => screen.queryByText("Your library is empty."),
  queryActionButton: () => screen.queryByRole("button", { name: "Add a game" }),
  getActionButton: () => screen.getByRole("button", { name: "Add a game" }),
};

const actions = {
  clickAction: async () => userEvent.click(elements.getActionButton()),
};

describe("EmptyState", () => {
  describe("given only a title", () => {
    beforeEach(() => {
      render(<EmptyState title="Nothing here yet" />);
    });

    it("renders the heading", () => {
      expect(elements.queryHeading()).not.toBeNull();
    });

    it("does not render the description", () => {
      expect(elements.queryDescription()).toBeNull();
    });

    it("does not render the action button", () => {
      expect(elements.queryActionButton()).toBeNull();
    });
  });

  describe("given a title and description", () => {
    beforeEach(() => {
      render(
        <EmptyState
          title="Nothing here yet"
          description="Your library is empty."
        />
      );
    });

    it("renders the heading", () => {
      expect(elements.queryHeading()).not.toBeNull();
    });

    it("renders the description text", () => {
      expect(elements.queryDescription()).not.toBeNull();
    });
  });

  describe("given an action slot", () => {
    beforeEach(() => {
      render(
        <EmptyState
          title="Nothing here yet"
          action={{ label: "Add a game", onClick: vi.fn() }}
        />
      );
    });

    it("renders the action button", () => {
      expect(elements.queryActionButton()).not.toBeNull();
    });
  });

  describe("given an action with an onClick handler", () => {
    it("invokes the onClick when the action button is clicked", async () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          title="Nothing here yet"
          action={{ label: "Add a game", onClick }}
        />
      );

      await actions.clickAction();
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("given both a primary and a secondary action", () => {
    beforeEach(() => {
      render(
        <EmptyState
          title="Start your library"
          action={{ label: "Add a game", onClick: vi.fn() }}
          secondaryAction={{ label: "Import from Steam", onClick: vi.fn() }}
        />
      );
    });

    it("renders both call-to-action buttons", () => {
      expect(
        screen.getByRole("button", { name: "Add a game" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Import from Steam" })
      ).toBeInTheDocument();
    });
  });
});
