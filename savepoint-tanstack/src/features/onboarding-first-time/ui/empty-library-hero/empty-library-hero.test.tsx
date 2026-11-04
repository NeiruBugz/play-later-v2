import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmptyLibraryHero } from "./empty-library-hero";

const defaultProps = {
  libraryItemCount: 0,
  journalEntryCount: 0,
  userImage: null,
  userSteamId: null,
};

describe("EmptyLibraryHero", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("given the component is rendered with all steps incomplete", () => {
    it("renders the hero card with the welcome heading", () => {
      render(<EmptyLibraryHero {...defaultProps} onAddGame={vi.fn()} />);
      expect(screen.getByText("Start your library")).toBeDefined();
    });

    it("renders the empty-library-hero test id", () => {
      render(<EmptyLibraryHero {...defaultProps} onAddGame={vi.fn()} />);
      expect(screen.getByTestId("empty-library-hero")).toBeDefined();
    });
  });
});
