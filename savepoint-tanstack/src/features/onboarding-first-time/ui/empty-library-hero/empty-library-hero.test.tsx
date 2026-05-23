import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

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
      render(<EmptyLibraryHero {...defaultProps} />);
      expect(screen.getByText("Start Your Gaming Journey")).toBeDefined();
    });

    it("renders the empty-library-hero test id", () => {
      render(<EmptyLibraryHero {...defaultProps} />);
      expect(screen.getByTestId("empty-library-hero")).toBeDefined();
    });
  });
});
