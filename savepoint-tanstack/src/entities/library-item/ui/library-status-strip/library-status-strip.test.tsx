import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";
import { LibraryStatusStrip } from "./library-status-strip";

const elements = {
  getStatusText: (label: string) => screen.getByText(label),
  queryRating: (n: number) => screen.queryByText(`${n}/10`),
  queryPlatform: (platform: string) => screen.queryByText(platform),
};

describe("LibraryStatusStrip", () => {
  describe("given each LibraryItemStatus value", () => {
    it.each([
      ["PLAYING", "Playing"],
      ["PLAYED", "Played"],
      ["UP_NEXT", "Up Next"],
      ["SHELF", "Shelf"],
      ["WISHLIST", "Wishlist"],
    ] as const)(
      "renders %s as the human label %s with data-status attribute",
      (status: LibraryItemStatus, label: string) => {
        const { container } = render(
          <LibraryStatusStrip status={status} rating={null} platform={null} />
        );
        expect(elements.getStatusText(label)).toBeDefined();
        // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
        const statusEl = container.querySelector(`[data-status="${status}"]`);
        expect(statusEl).not.toBeNull();
      }
    );
  });

  describe("given a rating", () => {
    beforeEach(() => {
      render(
        <LibraryStatusStrip status="PLAYING" rating={8} platform={null} />
      );
    });

    it("renders the rating as '{n}/10'", () => {
      expect(elements.queryRating(8)).not.toBeNull();
    });
  });

  describe("given no rating (null)", () => {
    beforeEach(() => {
      render(
        <LibraryStatusStrip status="PLAYING" rating={null} platform={null} />
      );
    });

    it("does not render a rating", () => {
      expect(screen.queryByText(/\/10/)).toBeNull();
    });
  });

  describe("given a platform", () => {
    beforeEach(() => {
      render(
        <LibraryStatusStrip status="PLAYING" rating={null} platform="PC" />
      );
    });

    it("renders the platform text", () => {
      expect(elements.queryPlatform("PC")).not.toBeNull();
    });
  });

  describe("given no platform (null)", () => {
    beforeEach(() => {
      render(
        <LibraryStatusStrip status="PLAYING" rating={null} platform={null} />
      );
    });

    it("does not render a platform", () => {
      expect(elements.getStatusText("Playing")).toBeDefined();
      expect(screen.queryByText("PC")).toBeNull();
    });
  });
});
