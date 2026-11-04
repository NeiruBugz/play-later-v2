import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/api";
import { DropdownMenuItem } from "@/shared/ui/dropdown-menu";

import { buildLibraryItemWithGame } from "../../../../../test/factories/builders.ts";
import { LibraryCardMenu } from "./library-card-menu";

const mockDeleteLibraryItemFn = vi.fn();

vi.mock("../../api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: (...args: unknown[]) => mockDeleteLibraryItemFn(...args),
}));

const mockInvalidate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    ...rest
  }: {
    to?: string;
    params?: Record<string, string>;
    children: React.ReactNode;
  } & Record<string, unknown>) => {
    let resolvedHref = to ?? "";
    if (params && to) {
      for (const [key, value] of Object.entries(params)) {
        resolvedHref = resolvedHref.replace(`$${key}`, value);
      }
    }
    return (
      <a href={resolvedHref} {...rest}>
        {children}
      </a>
    );
  },
  useRouter: () => ({ invalidate: mockInvalidate }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function ownedState(isOwned = true, setOwned = vi.fn()) {
  return { isOwned, setOwned, isPending: false };
}

function makeItem(): LibraryItemWithGame {
  return buildLibraryItemWithGame(
    { id: 1, status: "PLAYING" },
    { title: "Test Game", slug: "test-game" }
  );
}

const elements = {
  getTriggerButton: () =>
    screen.getByRole("button", { name: "Actions for Test Game" }),
  queryTriggerButton: () =>
    screen.queryByRole("button", { name: "Actions for Test Game" }),
  getViewJournalItem: () =>
    screen.getByRole("menuitem", { name: "View Journal Entries" }),
  getEditDetailsItem: () =>
    screen.getByRole("menuitem", { name: "Edit Library Details" }),
  getRemoveItem: () =>
    screen.getByRole("menuitem", { name: "Remove from Library" }),
  queryChangeStatusItem: () =>
    screen.queryByRole("menuitem", { name: "Change Status" }),
};

const actions = {
  openMenu: async () => {
    await userEvent.click(elements.getTriggerButton());
  },
  clickRemove: async () => {
    await userEvent.click(elements.getRemoveItem());
  },
  confirmRemove: async () => {
    await userEvent.click(
      await screen.findByRole("button", { name: "Remove" })
    );
  },
  cancelRemove: async () => {
    await userEvent.click(
      await screen.findByRole("button", { name: "Cancel" })
    );
  },
  clickEditDetails: async () => {
    await userEvent.click(elements.getEditDetailsItem());
  },
};

describe("LibraryCardMenu", () => {
  beforeEach(() => {
    mockDeleteLibraryItemFn.mockReset();
    mockInvalidate.mockReset();
    mockInvalidate.mockResolvedValue(undefined);
  });

  describe("given the menu trigger is rendered", () => {
    beforeEach(() => {
      render(
        <LibraryCardMenu
          item={makeItem()}
          onEdit={vi.fn()}
          ownership={ownedState()}
        />
      );
    });

    it("renders the actions trigger button with game title in accessible name", () => {
      expect(elements.getTriggerButton()).toBeDefined();
    });
  });

  describe("given the user opens the dropdown menu", () => {
    beforeEach(async () => {
      render(
        <LibraryCardMenu
          item={makeItem()}
          onEdit={vi.fn()}
          ownership={ownedState()}
        />
      );
      await actions.openMenu();
    });

    it("shows the View Journal Entries item", () => {
      expect(elements.getViewJournalItem()).toBeDefined();
    });

    it("shows the Edit Library Details item", () => {
      expect(elements.getEditDetailsItem()).toBeDefined();
    });

    it("shows the Remove from Library item", () => {
      expect(elements.getRemoveItem()).toBeDefined();
    });

    it("has no Change Status item — the status control on the card replaces it", () => {
      expect(elements.queryChangeStatusItem()).toBeNull();
    });
  });

  describe("given the user clicks Edit Library Details", () => {
    const mockOnEdit = vi.fn();

    beforeEach(async () => {
      render(
        <LibraryCardMenu
          item={makeItem()}
          onEdit={mockOnEdit}
          ownership={ownedState()}
        />
      );
      await actions.openMenu();
      await actions.clickEditDetails();
    });

    it("calls the onEdit callback", () => {
      expect(mockOnEdit).toHaveBeenCalledOnce();
    });
  });

  describe("given the user chooses Remove from Library", () => {
    beforeEach(async () => {
      render(
        <LibraryCardMenu
          item={makeItem()}
          onEdit={vi.fn()}
          ownership={ownedState()}
        />
      );
      await actions.openMenu();
      await actions.clickRemove();
    });

    it("asks for confirmation in the agreed words", async () => {
      expect(
        await screen.findByText("Remove Test Game from your library?")
      ).toBeDefined();
      expect(
        screen.getByText(
          "Its play history and rating will be deleted. Your notes stay in your Journal."
        )
      ).toBeDefined();
      expect(mockDeleteLibraryItemFn).not.toHaveBeenCalled();
    });

    it("needs no typing to confirm", async () => {
      await screen.findByRole("button", { name: "Remove" });
      expect(screen.queryByRole("textbox")).toBeNull();
    });

    it("keeps the game when Cancel is chosen", async () => {
      await actions.cancelRemove();
      expect(mockDeleteLibraryItemFn).not.toHaveBeenCalled();
      expect(
        screen.queryByText("Remove Test Game from your library?")
      ).toBeNull();
    });
  });

  describe("given the user confirms Remove from Library and the call succeeds", () => {
    beforeEach(async () => {
      mockDeleteLibraryItemFn.mockResolvedValue(undefined);

      render(
        <LibraryCardMenu
          item={makeItem()}
          onEdit={vi.fn()}
          ownership={ownedState()}
        />
      );
      await actions.openMenu();
      await actions.clickRemove();
      await actions.confirmRemove();
    });

    it("calls deleteLibraryItemFn with the item id", () => {
      expect(mockDeleteLibraryItemFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ itemId: 1 }),
        })
      );
    });

    it("calls router.invalidate after a successful delete", () => {
      expect(mockInvalidate).toHaveBeenCalled();
    });
  });

  describe("given the user confirms Remove from Library and the call fails with an Error", () => {
    beforeEach(async () => {
      mockDeleteLibraryItemFn.mockRejectedValue(new Error("Server error"));

      render(
        <LibraryCardMenu
          item={makeItem()}
          onEdit={vi.fn()}
          ownership={ownedState()}
        />
      );
      await actions.openMenu();
      await actions.clickRemove();
      await actions.confirmRemove();
    });

    it("calls deleteLibraryItemFn", () => {
      expect(mockDeleteLibraryItemFn).toHaveBeenCalled();
    });

    it("shows the error message via toast.error", async () => {
      const { toast } = await import("sonner");
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Server error");
    });
  });

  describe("given the user confirms Remove from Library and a non-Error is thrown", () => {
    beforeEach(async () => {
      mockDeleteLibraryItemFn.mockRejectedValue("unexpected");

      render(
        <LibraryCardMenu
          item={makeItem()}
          onEdit={vi.fn()}
          ownership={ownedState()}
        />
      );
      await actions.openMenu();
      await actions.clickRemove();
      await actions.confirmRemove();
    });

    it("shows a fallback error message via toast.error", async () => {
      const { toast } = await import("sonner");
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "Failed to remove from library"
      );
    });
  });

  describe("given the host passes extra items", () => {
    beforeEach(async () => {
      render(
        <LibraryCardMenu
          item={makeItem()}
          onEdit={vi.fn()}
          ownership={ownedState()}
          extraItems={<DropdownMenuItem>Put in Up Next</DropdownMenuItem>}
        />
      );
      await actions.openMenu();
    });

    it("shows them in the menu", () => {
      expect(
        screen.getByRole("menuitem", { name: "Put in Up Next" })
      ).toBeDefined();
    });
  });

  describe("given the game is owned", () => {
    it("offers 'I don't own it yet' and reports the choice", async () => {
      const setOwned = vi.fn();
      render(
        <LibraryCardMenu
          item={makeItem()}
          onEdit={vi.fn()}
          ownership={ownedState(true, setOwned)}
        />
      );
      await actions.openMenu();

      await userEvent.click(
        screen.getByRole("menuitem", { name: "I don't own it yet" })
      );

      expect(setOwned).toHaveBeenCalledWith(false);
    });
  });

  describe("given the game is not owned", () => {
    it("offers 'I own it' and reports the choice", async () => {
      const setOwned = vi.fn();
      render(
        <LibraryCardMenu
          item={makeItem()}
          onEdit={vi.fn()}
          ownership={ownedState(false, setOwned)}
        />
      );
      await actions.openMenu();

      await userEvent.click(screen.getByRole("menuitem", { name: "I own it" }));

      expect(setOwned).toHaveBeenCalledWith(true);
    });
  });
});
