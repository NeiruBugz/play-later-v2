import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { CriticScoreRing } from "./critic-score-ring";

const elements = {
  queryScore: (rounded: string) => screen.queryByText(rounded),
  queryByCriticLabel: () => screen.queryByLabelText("Critic score"),
  queryCriticOverline: () => screen.queryByText("Critic score"),
};

describe("CriticScoreRing", () => {
  describe("given a fractional 0-100 score", () => {
    beforeEach(() => {
      render(<CriticScoreRing value={87.6} />);
    });

    it("renders the rounded numeric score", () => {
      expect(elements.queryScore("88")).not.toBeNull();
    });

    it("exposes an accessible 'Critic score' label", () => {
      expect(elements.queryByCriticLabel()).not.toBeNull();
    });

    it("shows the 'Critic score' overline caption", () => {
      expect(elements.queryCriticOverline()).not.toBeNull();
    });
  });

  describe("given a score that rounds down", () => {
    beforeEach(() => {
      render(<CriticScoreRing value={74.2} />);
    });

    it("renders the floored rounded score", () => {
      expect(elements.queryScore("74")).not.toBeNull();
    });
  });

  describe("given a null score", () => {
    beforeEach(() => {
      render(<CriticScoreRing value={null} />);
    });

    it("renders nothing", () => {
      expect(elements.queryByCriticLabel()).toBeNull();
      expect(elements.queryCriticOverline()).toBeNull();
    });
  });

  describe("given an undefined score", () => {
    beforeEach(() => {
      render(<CriticScoreRing value={undefined} />);
    });

    it("renders nothing", () => {
      expect(elements.queryByCriticLabel()).toBeNull();
    });
  });
});
