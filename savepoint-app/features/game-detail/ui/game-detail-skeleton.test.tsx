import { render, screen } from "@testing-library/react";

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
    render(<GameDetailSkeleton />);

    // Verify animated placeholders exist
    const animatedPlaceholder = screen.getByTestId(
      "skeleton-animated-placeholder"
    );
    expect(animatedPlaceholder).toBeVisible();
  });

  it("should match the two-column layout structure", () => {
    render(<GameDetailSkeleton />);

    // Verify the grid layout exists for desktop
    const gridLayout = screen.getByTestId("skeleton-layout");
    expect(gridLayout).toBeVisible();
    expect(gridLayout).toHaveClass("lg:grid-cols-[300px_1fr]");
  });
});
