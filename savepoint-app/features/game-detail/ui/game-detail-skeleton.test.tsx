import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GameDetailSkeleton } from "./game-detail-skeleton";

describe("GameDetailSkeleton", () => {
  it("should render skeleton layout without errors", () => {
    render(<GameDetailSkeleton />);

    // Verify the skeleton renders with the expected structure
    // The component should have pulsing animations
    const skeleton = screen.getByRole("main");
    expect(skeleton).toBeInTheDocument();
  });

  it("should display skeleton placeholders for all major sections", () => {
    const { container } = render(<GameDetailSkeleton />);

    // Verify animated placeholders exist (animate-pulse class)
    const animatedElements = container.querySelectorAll(".animate-pulse");
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it("should match the two-column layout structure", () => {
    const { container } = render(<GameDetailSkeleton />);

    // Verify the grid layout exists for desktop
    const gridLayout = container.querySelector(
      ".lg\\:grid-cols-\\[300px_1fr\\]"
    );
    expect(gridLayout).toBeInTheDocument();
  });
});
