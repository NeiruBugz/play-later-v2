import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TimesToBeatSkeleton } from "./times-to-beat-skeleton";

describe("TimesToBeatSkeleton", () => {
  describe("given the component is rendered", () => {
    it("renders a busy section with the heading", () => {
      render(<TimesToBeatSkeleton />);
      const section = screen.getByRole("region");
      expect(section).toHaveAttribute("aria-busy", "true");
      expect(screen.getByText("Times to beat")).toBeDefined();
    });
  });
});
