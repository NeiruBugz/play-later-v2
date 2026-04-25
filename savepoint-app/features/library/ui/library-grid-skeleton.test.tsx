import { render, screen } from "@testing-library/react";

import { LibraryGridSkeleton } from "./library-grid-skeleton";

describe("LibraryGridSkeleton", () => {
  it("uses content-aware track sizing classes on the grid skeleton (≥sm)", () => {
    render(<LibraryGridSkeleton />);

    const grid = screen.getByRole("status", {
      name: "Loading your game library",
    });

    expect(grid).toHaveClass("grid-cols-[repeat(auto-fill,minmax(150px,1fr))]");
    expect(grid).toHaveClass(
      "sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]"
    );
    expect(grid).toHaveClass(
      "md:grid-cols-[repeat(auto-fill,minmax(160px,200px))]"
    );
    expect(grid).toHaveClass(
      "lg:grid-cols-[repeat(auto-fill,minmax(180px,220px))]"
    );

    expect(grid).toHaveClass("gap-4");
    expect(grid).toHaveClass("md:gap-[14px]");
    expect(grid).toHaveClass("lg:gap-4");
  });

  it("renders a mobile list-row skeleton container alongside the grid", () => {
    render(<LibraryGridSkeleton />);

    const mobileList = screen.getByRole("status", {
      name: "Loading your game library (mobile list)",
    });

    expect(mobileList).toHaveClass("sm:hidden");
    expect(mobileList).toHaveClass("flex-col");
  });
});
