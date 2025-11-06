import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RelatedGamesSection } from "./related-games-section";

const createMockGame = (id: number, hasCover: boolean = true) => ({
  id,
  name: `Test Game ${id}`,
  slug: `test-game-${id}`,
  cover: hasCover ? { image_id: `cover${id}` } : undefined,
});

const createMockFranchise = (
  franchiseId: number,
  franchiseName: string,
  gameCount: number
) => ({
  franchiseId,
  franchiseName,
  games: Array.from({ length: gameCount }, (_, i) => createMockGame(i + 1)),
});

describe("RelatedGamesSection", () => {
  it("should not render when no franchises provided", () => {
    const { container } = render(<RelatedGamesSection franchises={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render single franchise without tabs", () => {
    const franchises = [createMockFranchise(1, "Test Franchise", 5)];
    render(<RelatedGamesSection franchises={franchises} />);

    expect(screen.getByText("Related Games")).toBeInTheDocument();
    expect(screen.getByText("Test Franchise")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("should render all games in scroll area for single franchise", () => {
    const franchises = [createMockFranchise(1, "Test Franchise", 10)];
    render(<RelatedGamesSection franchises={franchises} />);

    expect(screen.getByText("Test Game 1")).toBeInTheDocument();
    expect(screen.getByText("Test Game 10")).toBeInTheDocument();
  });

  it("should render tabs for multiple franchises", () => {
    const franchises = [
      createMockFranchise(1, "Franchise A", 5),
      createMockFranchise(2, "Franchise B", 3),
    ];
    render(<RelatedGamesSection franchises={franchises} />);

    expect(screen.getByText("Related Games")).toBeInTheDocument();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByText(/Franchise A \(5\)/)).toBeInTheDocument();
    expect(screen.getByText(/Franchise B \(3\)/)).toBeInTheDocument();
  });

  it("should show game count in tabs", () => {
    const franchises = [
      createMockFranchise(1, "Franchise A", 10),
      createMockFranchise(2, "Franchise B", 25),
    ];
    render(<RelatedGamesSection franchises={franchises} />);

    expect(screen.getByText(/Franchise A \(10\)/)).toBeInTheDocument();
    expect(screen.getByText(/Franchise B \(25\)/)).toBeInTheDocument();
  });

  it("should render games with cover images", () => {
    const franchises = [createMockFranchise(1, "Test Franchise", 1)];
    render(<RelatedGamesSection franchises={franchises} />);

    const image = screen.getByRole("img", { name: /Test Game 1 cover/ });
    expect(image).toBeInTheDocument();
    expect(image.getAttribute("src")).toContain("cover1");
  });

  it("should render placeholder for games without cover images", () => {
    const franchise = {
      franchiseId: 1,
      franchiseName: "Test Franchise",
      games: [createMockGame(1, false)],
    };
    const { container } = render(
      <RelatedGamesSection franchises={[franchise]} />
    );

    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should render clickable links to game detail pages", () => {
    const franchises = [createMockFranchise(1, "Test Franchise", 1)];
    render(<RelatedGamesSection franchises={franchises} />);

    const link = screen.getByRole("link", { name: /Test Game 1/ });
    expect(link).toHaveAttribute("href", "/games/test-game-1");
  });

  it("should render scroll area with fixed height", () => {
    const franchises = [createMockFranchise(1, "Test Franchise", 20)];
    const { container } = render(
      <RelatedGamesSection franchises={franchises} />
    );

    const scrollArea = container.querySelector('[class*="overflow-hidden"]');
    expect(scrollArea).toBeInTheDocument();
  });
});
