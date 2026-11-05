import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionLabel } from "./section-label";

describe("SectionLabel", () => {
  describe("given only text", () => {
    it("renders the text as a level-2 heading", () => {
      render(<SectionLabel>This month</SectionLabel>);

      expect(
        screen.getByRole("heading", { name: "This month", level: 2 })
      ).toBeInTheDocument();
    });
  });

  describe("given a heading level", () => {
    it("renders the text as a heading of that level", () => {
      render(<SectionLabel as="h3">Platforms</SectionLabel>);

      expect(
        screen.getByRole("heading", { name: "Platforms", level: 3 })
      ).toBeInTheDocument();
    });
  });

  describe("given a non-heading element", () => {
    it("renders the text without adding a heading to the page", () => {
      render(<SectionLabel as="p">Sort</SectionLabel>);

      expect(screen.getByText("Sort")).toBeInTheDocument();
      expect(screen.queryByRole("heading")).toBeNull();
    });
  });
});
