import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ScrollArea, ScrollBar } from "./scroll-area";

const elements = {
  queryScrollbar: () => screen.queryByRole("scrollbar"),
};

describe("ScrollArea", () => {
  describe("given children and a scrollbar", () => {
    beforeEach(() => {
      render(
        <ScrollArea>
          <p>Scrollable content</p>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      );
    });

    it("renders the children inside the viewport", () => {
      expect(screen.queryByText("Scrollable content")).not.toBeNull();
    });

    it("renders the scrollbar element in the DOM", () => {
      expect(elements.queryScrollbar()).not.toBeNull();
    });
  });

  describe("given a horizontal scrollbar orientation", () => {
    beforeEach(() => {
      render(
        <ScrollArea>
          <p>Wide content</p>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      );
    });

    it("renders the scrollbar with aria-orientation='horizontal'", () => {
      expect(elements.queryScrollbar()).toHaveAttribute(
        "aria-orientation",
        "horizontal"
      );
    });
  });

  describe("given a vertical scrollbar orientation", () => {
    beforeEach(() => {
      render(
        <ScrollArea>
          <p>Tall content</p>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      );
    });

    it("renders the scrollbar with aria-orientation='vertical'", () => {
      expect(elements.queryScrollbar()).toHaveAttribute(
        "aria-orientation",
        "vertical"
      );
    });
  });
});
