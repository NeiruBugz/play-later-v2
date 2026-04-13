import { render, screen } from "@testing-library/react";

import { RatingHistogram } from "./rating-histogram";

function makeHistogram(counts: number[]): { rating: number; count: number }[] {
  return Array.from({ length: 10 }, (_, i) => ({
    rating: i + 1,
    count: counts[i] ?? 0,
  }));
}

describe("RatingHistogram", () => {
  it("renders nothing when ratedCount is below threshold", () => {
    const { container } = render(
      <RatingHistogram
        ratingHistogram={makeHistogram([0, 0, 1, 1, 0, 2, 0, 0, 0, 0])}
        ratedCount={4}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("rating-histogram")).not.toBeInTheDocument();
  });

  it("renders at the threshold (ratedCount === 5)", () => {
    render(
      <RatingHistogram
        ratingHistogram={makeHistogram([1, 0, 1, 1, 0, 1, 0, 1, 0, 0])}
        ratedCount={5}
      />
    );

    expect(screen.getByTestId("rating-histogram")).toBeInTheDocument();
  });

  it("renders all 10 bars even when some counts are zero", () => {
    render(
      <RatingHistogram
        ratingHistogram={makeHistogram([0, 0, 0, 0, 0, 5, 0, 0, 0, 0])}
        ratedCount={5}
      />
    );

    for (let rating = 1; rating <= 10; rating++) {
      expect(
        screen.getByTestId(`rating-histogram-bar-${rating}`)
      ).toBeInTheDocument();
    }
  });

  it("bar heights are proportional to counts relative to max", () => {
    const counts = [0, 0, 0, 0, 0, 10, 5, 0, 0, 0];
    render(
      <RatingHistogram
        ratingHistogram={makeHistogram(counts)}
        ratedCount={15}
      />
    );

    const maxBarFill = screen.getByTestId("rating-histogram-bar-fill-6");
    const halfBarFill = screen.getByTestId("rating-histogram-bar-fill-7");
    const zeroBarFill = screen.getByTestId("rating-histogram-bar-fill-1");

    expect(maxBarFill.style.height).toBe("100%");
    expect(halfBarFill.style.height).toBe("50%");
    expect(zeroBarFill.style.height).toBe("0%");
  });

  it("non-zero counts render with a minimum visual presence", () => {
    const counts = [1, 0, 0, 0, 0, 100, 0, 0, 0, 0];
    render(
      <RatingHistogram
        ratingHistogram={makeHistogram(counts)}
        ratedCount={101}
      />
    );

    const tinyBarFill = screen.getByTestId("rating-histogram-bar-fill-1");
    const heightPercent = parseInt(tinyBarFill.style.height, 10);

    expect(heightPercent).toBeGreaterThan(0);
    expect(heightPercent).toBeGreaterThanOrEqual(4);
  });

  it("exposes aria labels for screen readers on each bar", () => {
    render(
      <RatingHistogram
        ratingHistogram={makeHistogram([0, 0, 0, 0, 0, 3, 2, 0, 0, 1])}
        ratedCount={6}
      />
    );

    expect(
      screen.getByRole("button", { name: "3 games rated 3★" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "2 games rated 3.5★" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "1 game rated 5★" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "0 games rated 0.5★" })
    ).toBeInTheDocument();
  });

  it("exposes a region-level aria label for the histogram", () => {
    render(
      <RatingHistogram
        ratingHistogram={makeHistogram([0, 0, 0, 0, 0, 5, 0, 0, 0, 0])}
        ratedCount={5}
      />
    );

    expect(screen.getByLabelText("Rating distribution")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Histogram of 5 rated games across 10 rating bins/)
    ).toBeInTheDocument();
  });
});
