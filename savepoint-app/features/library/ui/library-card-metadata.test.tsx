import { render, screen } from "@testing-library/react";

import { LibraryItemStatus } from "@/shared/types";

import { LibraryCardMetadata } from "./library-card-metadata";

vi.mock("@/shared/lib/date", () => ({
  formatRelativeDate: vi.fn(() => "2 days ago"),
}));

const CREATED_AT = new Date("2025-01-01T00:00:00Z");
const STARTED_AT = new Date("2025-01-15T00:00:00Z");
const UPDATED_AT = new Date("2025-02-01T00:00:00Z");

describe("LibraryCardMetadata", () => {
  describe("platform badge + bullet rendering", () => {
    it("renders platform badge, bullet, and contextual date when platform is set", () => {
      render(
        <LibraryCardMetadata
          status={LibraryItemStatus.SHELF}
          createdAt={CREATED_AT}
          platform="PlayStation 5"
        />
      );

      const root = screen.getByTestId("library-card-metadata");
      expect(root).toHaveTextContent("PlayStation 5");
      expect(root).toHaveTextContent("•");
      expect(root).toHaveTextContent("Added 2 days ago");
    });

    it("omits badge and bullet when platform is null", () => {
      render(
        <LibraryCardMetadata
          status={LibraryItemStatus.SHELF}
          createdAt={CREATED_AT}
          platform={null}
        />
      );

      const root = screen.getByTestId("library-card-metadata");
      expect(root).toHaveTextContent("Added 2 days ago");
      expect(root).not.toHaveTextContent("•");
    });

    it("omits badge and bullet when platform is an empty string", () => {
      render(
        <LibraryCardMetadata
          status={LibraryItemStatus.SHELF}
          createdAt={CREATED_AT}
          platform=""
        />
      );

      const root = screen.getByTestId("library-card-metadata");
      expect(root).toHaveTextContent("Added 2 days ago");
      expect(root).not.toHaveTextContent("•");
    });
  });

  describe("contextual date — PLAYING", () => {
    it("renders 'Started <relative>' from startedAt", () => {
      render(
        <LibraryCardMetadata
          status={LibraryItemStatus.PLAYING}
          startedAt={STARTED_AT}
          createdAt={CREATED_AT}
          platform={null}
        />
      );

      expect(screen.getByTestId("library-card-metadata")).toHaveTextContent(
        "Started 2 days ago"
      );
    });

    it("falls back to 'Added <relative>' when startedAt is null", () => {
      render(
        <LibraryCardMetadata
          status={LibraryItemStatus.PLAYING}
          startedAt={null}
          createdAt={CREATED_AT}
          platform={null}
        />
      );

      expect(screen.getByTestId("library-card-metadata")).toHaveTextContent(
        "Added 2 days ago"
      );
    });
  });

  describe("contextual date — UP_NEXT", () => {
    it("renders 'Started <relative>' from startedAt", () => {
      render(
        <LibraryCardMetadata
          status={LibraryItemStatus.UP_NEXT}
          startedAt={STARTED_AT}
          createdAt={CREATED_AT}
          platform={null}
        />
      );

      expect(screen.getByTestId("library-card-metadata")).toHaveTextContent(
        "Started 2 days ago"
      );
    });

    it("falls back to 'Added <relative>' when startedAt is null", () => {
      render(
        <LibraryCardMetadata
          status={LibraryItemStatus.UP_NEXT}
          startedAt={null}
          createdAt={CREATED_AT}
          platform={null}
        />
      );

      expect(screen.getByTestId("library-card-metadata")).toHaveTextContent(
        "Added 2 days ago"
      );
    });
  });

  describe("contextual date — PLAYED", () => {
    it("renders 'Finished <relative>' from updatedAt", () => {
      render(
        <LibraryCardMetadata
          status={LibraryItemStatus.PLAYED}
          startedAt={STARTED_AT}
          createdAt={CREATED_AT}
          updatedAt={UPDATED_AT}
          platform={null}
        />
      );

      expect(screen.getByTestId("library-card-metadata")).toHaveTextContent(
        "Finished 2 days ago"
      );
    });
  });

  describe("contextual date — SHELF", () => {
    it("renders 'Added <relative>' from createdAt", () => {
      render(
        <LibraryCardMetadata
          status={LibraryItemStatus.SHELF}
          createdAt={CREATED_AT}
          platform={null}
        />
      );

      expect(screen.getByTestId("library-card-metadata")).toHaveTextContent(
        "Added 2 days ago"
      );
    });
  });

  describe("contextual date — WISHLIST", () => {
    it("renders 'Added <relative>' from createdAt", () => {
      render(
        <LibraryCardMetadata
          status={LibraryItemStatus.WISHLIST}
          createdAt={CREATED_AT}
          platform={null}
        />
      );

      expect(screen.getByTestId("library-card-metadata")).toHaveTextContent(
        "Added 2 days ago"
      );
    });
  });

  describe("badge + date combined", () => {
    it("renders badge + bullet + 'Started ...' for PLAYING with platform", () => {
      render(
        <LibraryCardMetadata
          status={LibraryItemStatus.PLAYING}
          startedAt={STARTED_AT}
          createdAt={CREATED_AT}
          platform="PC"
        />
      );

      const root = screen.getByTestId("library-card-metadata");
      expect(root).toHaveTextContent("PC");
      expect(root).toHaveTextContent("•");
      expect(root).toHaveTextContent("Started 2 days ago");
    });

    it("renders badge + bullet + 'Finished ...' for PLAYED with platform", () => {
      render(
        <LibraryCardMetadata
          status={LibraryItemStatus.PLAYED}
          startedAt={STARTED_AT}
          createdAt={CREATED_AT}
          updatedAt={UPDATED_AT}
          platform="Xbox Series X"
        />
      );

      const root = screen.getByTestId("library-card-metadata");
      expect(root).toHaveTextContent("Xbox Series X");
      expect(root).toHaveTextContent("•");
      expect(root).toHaveTextContent("Finished 2 days ago");
    });
  });
});
