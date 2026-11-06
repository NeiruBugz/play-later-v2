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
      ["WANT", "Want"],
      ["PLAYING", "Playing"],
      ["DONE", "Done"],
    ] as const)(
      "renders %s with title-case label %s and an aria-label",
      (status: LibraryItemStatus, label: string) => {
        render(<LibraryStatusBadge status={status} />);
        const badge = elements.getBadge();
        expect(badge).toHaveAttribute("aria-label", `Status: ${label}`);
        expect(badge).toHaveTextContent(label);
        expect(badge).toHaveAttribute("data-status", status);
      }
    );
  });

  describe("title case and no truncation", () => {
    it("never applies the uppercase class", () => {
      render(<LibraryStatusBadge status="PLAYING" />);
      expect(elements.getBadge().className).not.toMatch(/\buppercase\b/);
    });

    it("keeps the label on one line without truncating it", () => {
      render(<LibraryStatusBadge status="PLAYING" />);
      const badge = elements.getBadge();
      expect(badge.className).toMatch(/whitespace-nowrap/);
      expect(badge.className).toMatch(/shrink-0/);
      expect(badge.className).not.toMatch(/\btruncate\b/);
    });
  });

  describe("given hidden=true", () => {
    it("renders nothing", () => {
      render(<LibraryStatusBadge status="PLAYING" hidden />);
      expect(elements.queryBadge()).toBeNull();
    });
  });

  describe("status-themed leading dot", () => {
    it.each([
      ["WANT", "want"],
      ["PLAYING", "playing"],
      ["DONE", "done"],
    ] as const)(
      "marks the %s dot with its own status variant",
      (status: LibraryItemStatus, variant: string) => {
        render(<LibraryStatusBadge status={status} />);
        const dot = screen.getByTestId("library-status-badge-dot");
        expect(dot).toHaveAttribute("data-status-variant", variant);
      }
    );
  });

  describe("custom className", () => {
    it("appends the consumer-provided className", () => {
      render(
        <LibraryStatusBadge status="WANT" className="absolute top-2 left-2" />
      );
      expect(elements.getBadge().className).toMatch(/absolute/);
    });
  });
});
