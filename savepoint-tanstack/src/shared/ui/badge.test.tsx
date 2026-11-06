import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";

const elements = {
  getBadge: (text: string) => screen.getByText(text),
};

describe("Badge", () => {
  describe("given default variant", () => {
    it("renders the children text", () => {
      render(<Badge>New</Badge>);
      expect(elements.getBadge("New")).toBeDefined();
    });

    it("exposes the default variant", () => {
      render(<Badge>New</Badge>);
      expect(elements.getBadge("New")).toHaveAttribute(
        "data-variant",
        "default"
      );
    });
  });

  describe("given the destructive variant", () => {
    it("exposes the destructive variant", () => {
      render(<Badge variant="destructive">Danger</Badge>);
      expect(elements.getBadge("Danger")).toHaveAttribute(
        "data-variant",
        "destructive"
      );
    });
  });

  describe("given a custom className", () => {
    it("merges the custom class with the variant classes", () => {
      render(<Badge className="custom-class">X</Badge>);
      expect(elements.getBadge("X")).toHaveClass("custom-class");
    });
  });
});
