import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";

const elements = {
  getByText: (text: string) => screen.getByText(text),
};

describe("Badge", () => {
  describe("given default variant", () => {
    it("renders the children text", () => {
      render(<Badge>New</Badge>);
      expect(elements.getByText("New")).toBeDefined();
    });

    it("applies the default primary background class", () => {
      render(<Badge>New</Badge>);
      expect(elements.getByText("New").className).toContain("bg-primary");
    });
  });

  describe("given a status variant", () => {
    it("applies the status-playing background variable", () => {
      render(<Badge variant="playing">Playing</Badge>);
      const node = elements.getByText("Playing");
      expect(node.className).toContain("bg-[var(--status-playing)]");
    });

    it("applies the destructive background class", () => {
      render(<Badge variant="destructive">Danger</Badge>);
      expect(elements.getByText("Danger").className).toContain(
        "bg-destructive"
      );
    });
  });

  describe("given a custom className", () => {
    it("merges the custom class with the variant classes", () => {
      render(<Badge className="custom-class">X</Badge>);
      expect(elements.getByText("X").className).toContain("custom-class");
    });
  });
});
