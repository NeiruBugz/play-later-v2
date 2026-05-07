import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";
import { LibraryStatusBadge } from "./library-status-badge";

const elements = {
  queryBadge: () => screen.queryByLabelText(/^Status:/),
  getBadge: () => screen.getByLabelText(/^Status:/),
};

describe("LibraryStatusBadge", () => {
  describe("given each LibraryItemStatus value", () => {
    it.each([
      ["PLAYING", "Playing"],
      ["PLAYED", "Played"],
      ["UP_NEXT", "Up Next"],
      ["SHELF", "Shelf"],
      ["WISHLIST", "Wishlist"],
    ] as const)(
      "renders %s with label %s and an aria-label",
      (status: LibraryItemStatus, label: string) => {
        render(<LibraryStatusBadge status={status} />);
        const badge = elements.getBadge();
        expect(badge).toHaveAttribute("aria-label", `Status: ${label}`);
        expect(badge).toHaveTextContent(label);
        expect(badge).toHaveAttribute("data-status", status);
      }
    );
  });

  describe("given status UP_NEXT and hasBeenPlayed=true", () => {
    it("renders the Replay label", () => {
      render(<LibraryStatusBadge status="UP_NEXT" hasBeenPlayed />);
      expect(elements.getBadge()).toHaveTextContent("Replay");
      expect(elements.getBadge()).toHaveAttribute(
        "aria-label",
        "Status: Replay"
      );
    });
  });

  describe("given status UP_NEXT and hasBeenPlayed=false", () => {
    it("renders the Up Next label", () => {
      render(<LibraryStatusBadge status="UP_NEXT" hasBeenPlayed={false} />);
      expect(elements.getBadge()).toHaveTextContent("Up Next");
    });
  });

  describe("given hidden=true", () => {
    it("renders nothing", () => {
      render(<LibraryStatusBadge status="PLAYING" hidden />);
      expect(elements.queryBadge()).toBeNull();
    });
  });

  describe("status-themed className", () => {
    it("applies the matching status CSS-var background token", () => {
      render(<LibraryStatusBadge status="PLAYING" />);
      const badge = elements.getBadge();
      // The variant resolves to `bg-[var(--status-playing)]` per the shared
      // Badge primitive's variant table.
      expect(badge.className).toMatch(/bg-\[var\(--status-playing\)\]/);
      expect(badge.className).toMatch(
        /text-\[var\(--status-playing-foreground\)\]/
      );
    });
  });

  describe("custom className", () => {
    it("appends the consumer-provided className", () => {
      render(
        <LibraryStatusBadge status="SHELF" className="absolute top-2 left-2" />
      );
      const badge = elements.getBadge();
      expect(badge.className).toMatch(/absolute/);
    });
  });
});
