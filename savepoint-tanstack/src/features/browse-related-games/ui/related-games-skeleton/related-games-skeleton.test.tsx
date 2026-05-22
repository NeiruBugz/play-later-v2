import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RelatedGamesSkeleton } from "./related-games-skeleton";

describe("RelatedGamesSkeleton", () => {
  describe("given the component is rendered", () => {
    it("renders a busy section with the heading", () => {
      render(<RelatedGamesSkeleton />);
      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("aria-busy", "true");
      expect(screen.getByText("Related games")).toBeDefined();
    });
  });
});
