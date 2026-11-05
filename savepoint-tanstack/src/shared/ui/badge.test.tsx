import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./badge";

const PLATFORM_VARIANTS = ["playstation", "xbox", "nintendo", "pc"] as const;
const STATUS_VARIANTS = ["want", "playing", "done"] as const;

const elements = {
  getBadge: (text: string) => screen.getByText(text),
};

const actions = {
  renderVariants: (variants: readonly string[]) => {
    render(
      <>
        {variants.map((variant) => (
          <Badge key={variant} variant={variant as "subtle"}>
            {variant}
          </Badge>
        ))}
      </>
    );
    return variants.map((variant) => elements.getBadge(variant).className);
  },
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

  describe("given a status variant", () => {
    it("exposes the playing variant", () => {
      render(<Badge variant="playing">Playing</Badge>);
      expect(elements.getBadge("Playing")).toHaveAttribute(
        "data-variant",
        "playing"
      );
    });

    it("styles want, playing and done differently from each other", () => {
      const classNames = actions.renderVariants(STATUS_VARIANTS);
      expect(new Set(classNames).size).toBe(STATUS_VARIANTS.length);
    });
  });

  describe("given a platform variant", () => {
    it("styles every platform exactly like the neutral subtle variant", () => {
      const [subtle, ...platforms] = actions.renderVariants([
        "subtle",
        ...PLATFORM_VARIANTS,
      ]);
      expect(platforms).toEqual(platforms.map(() => subtle));
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
