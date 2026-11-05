import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConflictError } from "@/shared/lib/errors";
import { DropdownMenu, DropdownMenuContent } from "@/shared/ui/dropdown-menu";

import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";
import { useUpNextMembership } from "../../model/use-up-next-membership";
import { UpNextMenuActions } from "./up-next-menu-actions";

const { addMock, removeMock, invalidateMock } = vi.hoisted(() => ({
  addMock: vi.fn(),
  removeMock: vi.fn(),
  invalidateMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: invalidateMock }),
}));
vi.mock("../../api/add-to-up-next-fn", () => ({ addToUpNextFn: addMock }));
vi.mock("../../api/remove-from-up-next-fn", () => ({
  removeFromUpNextFn: removeMock,
}));

function Harness({
  status,
  upNextPosition = null,
}: {
  status: LibraryItemStatus;
  upNextPosition?: number | null;
}) {
  const membership = useUpNextMembership({
    id: 7,
    gameTitle: "Hades",
    upNextPosition,
  });
  return (
    <>
      <p>marker: {membership.upNextPosition ?? "none"}</p>
      <DropdownMenu open>
        <DropdownMenuContent>
          <UpNextMenuActions status={status} membership={membership} />
        </DropdownMenuContent>
      </DropdownMenu>
      <Toaster />
    </>
  );
}

const elements = {
  getPut: () => screen.getByRole("menuitem", { name: "Put in Up Next" }),
  queryPut: () => screen.queryByRole("menuitem", { name: "Put in Up Next" }),
  getRemove: () =>
    screen.getByRole("menuitem", { name: "Remove from Up Next" }),
  queryRemove: () =>
    screen.queryByRole("menuitem", { name: "Remove from Up Next" }),
};

describe("UpNextMenuActions", () => {
  beforeEach(() => {
    addMock.mockReset();
    removeMock.mockReset();
    invalidateMock.mockReset();
    invalidateMock.mockResolvedValue(undefined);
  });

  describe("given a Want game that is not queued", () => {
    it("offers Put in Up Next", () => {
      render(<Harness status="WANT" />);
      expect(elements.getPut()).toBeDefined();
      expect(elements.queryRemove()).toBeNull();
    });

    it("calls addToUpNextFn and shows the place the server gave", async () => {
      addMock.mockResolvedValue({ position: 3 });
      render(<Harness status="WANT" />);
      await userEvent.click(elements.getPut());
      expect(addMock).toHaveBeenCalledWith({ data: { id: 7 } });
      expect(await screen.findByText("marker: 3")).toBeDefined();
      await waitFor(() => expect(invalidateMock).toHaveBeenCalledOnce());
    });

    it("shows the full-queue message and stays unqueued when the queue is full", async () => {
      addMock.mockRejectedValue(
        new ConflictError("raw", { code: "UP_NEXT_FULL" })
      );
      render(<Harness status="WANT" />);
      await userEvent.click(elements.getPut());
      expect(
        await screen.findByText(
          "Up Next holds 5 games. Remove one to add this."
        )
      ).toBeDefined();
      expect(screen.getByText("marker: none")).toBeDefined();
      expect(invalidateMock).not.toHaveBeenCalled();
    });
  });

  describe("given a queued Want game", () => {
    it("offers Remove from Up Next and calls removeFromUpNextFn", async () => {
      removeMock.mockResolvedValue({ position: null });
      render(<Harness status="WANT" upNextPosition={2} />);
      await userEvent.click(elements.getRemove());
      expect(removeMock).toHaveBeenCalledWith({ data: { id: 7 } });
      expect(await screen.findByText("marker: none")).toBeDefined();
    });

    it("reverts the removal and explains when saving fails", async () => {
      removeMock.mockRejectedValue(new Error("offline"));
      render(<Harness status="WANT" upNextPosition={2} />);
      await userEvent.click(elements.getRemove());
      expect(
        await screen.findByText("Couldn't save. Try again.")
      ).toBeDefined();
      expect(screen.getByText("marker: 2")).toBeDefined();
      expect(invalidateMock).not.toHaveBeenCalled();
    });
  });

  describe("given a Playing game", () => {
    it("offers neither action", () => {
      render(<Harness status="PLAYING" />);
      expect(elements.queryPut()).toBeNull();
      expect(elements.queryRemove()).toBeNull();
    });
  });
});
