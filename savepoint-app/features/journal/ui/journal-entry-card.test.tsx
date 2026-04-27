import { renderWithTestProviders } from "@/test/utils/test-provider";
import { screen } from "@testing-library/react";
import React from "react";

import { JournalVisibility } from "@/shared/types";

import { JournalEntryCard } from "./journal-entry-card";

vi.mock("@/widgets/game-card", () => ({
  GameCardCover: () => <div data-testid="game-cover" />,
}));

const baseGame = {
  id: "game-1",
  title: "Hollow Knight",
  slug: "hollow-knight",
  coverImage: "cover-id",
};

const baseReflectionEntry = {
  id: "entry-1",
  userId: "user-1",
  gameId: "game-1",
  libraryItemId: null,
  kind: "REFLECTION" as const,
  title: "A rainy afternoon",
  content: "Explored the forgotten crossroads today.",
  playedMinutes: null,
  tags: [],
  mood: null,
  playSession: null,
  visibility: JournalVisibility.PRIVATE,
  createdAt: new Date("2024-03-15T10:00:00Z"),
  updatedAt: new Date("2024-03-15T10:00:00Z"),
  publishedAt: null,
};

const baseQuickEntry = {
  ...baseReflectionEntry,
  id: "entry-2",
  kind: "QUICK" as const,
  title: null,
  content: "Quick note from today.",
  playedMinutes: 45,
};

describe("JournalEntryCard — REFLECTION variant", () => {
  describe("mood eyebrow", () => {
    it("does not render when mood is null", () => {
      renderWithTestProviders(
        <JournalEntryCard entry={baseReflectionEntry} game={baseGame} />
      );
      expect(
        screen.queryByText(/hyped|chill|fried|proud|curious|nostalgic/i)
      ).not.toBeInTheDocument();
    });

    it("renders mood label with text-caption above the entry title", () => {
      const entry = { ...baseReflectionEntry, mood: "EXCITED" as const };
      renderWithTestProviders(
        <JournalEntryCard entry={entry} game={baseGame} />
      );

      const eyebrow = screen.getByText("Hyped");
      expect(eyebrow).toBeInTheDocument();
      expect(eyebrow).toHaveClass("text-caption");

      const title = screen.getByText("A rainy afternoon");
      expect(
        eyebrow.compareDocumentPosition(title) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it("renders mood eyebrow above the title, not below tags", () => {
      const entry = {
        ...baseReflectionEntry,
        mood: "RELAXED" as const,
        tags: ["platformer"],
      };
      renderWithTestProviders(
        <JournalEntryCard entry={entry} game={baseGame} />
      );

      const eyebrow = screen.getByText("Chill");
      const title = screen.getByText("A rainy afternoon");
      const chip = screen.getByText("platformer");

      expect(
        eyebrow.compareDocumentPosition(title) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      expect(
        title.compareDocumentPosition(chip) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });
  });

  describe("tag chips", () => {
    it("renders tags as outlined chips without leading #", () => {
      const entry = { ...baseReflectionEntry, tags: ["platformer", "#boss"] };
      renderWithTestProviders(
        <JournalEntryCard entry={entry} game={baseGame} />
      );

      expect(screen.getByText("platformer")).toBeInTheDocument();
      expect(screen.getByText("boss")).toBeInTheDocument();
      expect(screen.queryByText("#platformer")).not.toBeInTheDocument();
      expect(screen.queryByText("#boss")).not.toBeInTheDocument();
    });

    it("strips multiple leading # characters", () => {
      const entry = { ...baseReflectionEntry, tags: ["##meta"] };
      renderWithTestProviders(
        <JournalEntryCard entry={entry} game={baseGame} />
      );

      expect(screen.getByText("meta")).toBeInTheDocument();
      expect(screen.queryByText("##meta")).not.toBeInTheDocument();
    });

    it("renders no tag section when tags array is empty", () => {
      renderWithTestProviders(
        <JournalEntryCard entry={baseReflectionEntry} game={baseGame} />
      );
      expect(screen.queryByText("#")).not.toBeInTheDocument();
    });
  });

  describe("hideGameMetadata prop", () => {
    it("hides game cover and title when hideGameMetadata is true", () => {
      renderWithTestProviders(
        <JournalEntryCard
          entry={baseReflectionEntry}
          game={baseGame}
          hideGameMetadata
        />
      );
      expect(screen.queryByTestId("game-cover")).not.toBeInTheDocument();
      expect(screen.queryByText("Hollow Knight")).not.toBeInTheDocument();
    });

    it("shows game cover and title by default", () => {
      renderWithTestProviders(
        <JournalEntryCard entry={baseReflectionEntry} game={baseGame} />
      );
      expect(screen.getByTestId("game-cover")).toBeInTheDocument();
      expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
    });
  });
});

describe("JournalEntryCard — QUICK variant", () => {
  describe("mood eyebrow", () => {
    it("renders mood above content line, not as a same-row badge", () => {
      const entry = { ...baseQuickEntry, mood: "ACCOMPLISHED" as const };
      renderWithTestProviders(
        <JournalEntryCard entry={entry} game={baseGame} />
      );

      const eyebrow = screen.getByText("Proud");
      expect(eyebrow).toHaveClass("text-caption");
    });

    it("does not render mood when null", () => {
      renderWithTestProviders(
        <JournalEntryCard entry={baseQuickEntry} game={baseGame} />
      );
      expect(
        screen.queryByText(/hyped|chill|fried|proud|curious|nostalgic/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("tag chips", () => {
    it("renders tag chips without leading # for quick entries", () => {
      const entry = { ...baseQuickEntry, tags: ["#speedrun", "difficult"] };
      renderWithTestProviders(
        <JournalEntryCard entry={entry} game={baseGame} />
      );

      expect(screen.getByText("speedrun")).toBeInTheDocument();
      expect(screen.getByText("difficult")).toBeInTheDocument();
      expect(screen.queryByText("#speedrun")).not.toBeInTheDocument();
    });
  });
});
