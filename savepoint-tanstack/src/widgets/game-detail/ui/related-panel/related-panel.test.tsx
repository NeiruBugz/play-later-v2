import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { RelatedPanel } from "./related-panel";

const elements = {
  querySlot: () => screen.queryByTestId("related-games-slot"),
};

describe("RelatedPanel", () => {
  describe("given a related-games slot", () => {
    beforeEach(() => {
      render(
        <RelatedPanel>
          <div data-testid="related-games-slot">Related games here</div>
        </RelatedPanel>
      );
    });

    it("renders the provided slot content", () => {
      expect(elements.querySlot()).not.toBeNull();
      expect(elements.querySlot()?.textContent).toBe("Related games here");
    });
  });
});
