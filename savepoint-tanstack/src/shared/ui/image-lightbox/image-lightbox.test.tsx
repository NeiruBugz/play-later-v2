import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ImageLightbox } from "./image-lightbox";

const images = [
  { src: "https://example.com/shot-1.jpg", alt: "Screenshot 1" },
  { src: "https://example.com/shot-2.jpg", alt: "Screenshot 2" },
  { src: "https://example.com/shot-3.jpg", alt: "Screenshot 3" },
];

const onOpenChange = vi.fn();
const onIndexChange = vi.fn();

const elements = {
  getCurrentImage: () =>
    screen.getByRole("img", { name: "Screenshot 2" }) as HTMLImageElement,
  queryCurrentImage: () => screen.queryByRole("img", { name: "Screenshot 2" }),
  getNext: () => screen.getByRole("button", { name: "Next screenshot" }),
  getPrev: () => screen.getByRole("button", { name: "Previous screenshot" }),
  getClose: () => screen.getByRole("button", { name: "Close" }),
  getThumbnail: (n: number) =>
    screen.getByRole("button", { name: `View screenshot ${n}` }),
};

const actions = {
  clickNext: () => userEvent.click(elements.getNext()),
  clickPrev: () => userEvent.click(elements.getPrev()),
  clickClose: () => userEvent.click(elements.getClose()),
  pressRight: () => userEvent.keyboard("{ArrowRight}"),
  pressLeft: () => userEvent.keyboard("{ArrowLeft}"),
  pressEscape: () => userEvent.keyboard("{Escape}"),
  jumpToThumbnail: (n: number) => userEvent.click(elements.getThumbnail(n)),
};

describe("ImageLightbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given it is open at index 1", () => {
    beforeEach(() => {
      render(
        <ImageLightbox
          images={images}
          open
          index={1}
          onOpenChange={onOpenChange}
          onIndexChange={onIndexChange}
        />
      );
    });

    it("renders the current image with an accessible alt", () => {
      expect(elements.queryCurrentImage()).not.toBeNull();
      expect(elements.getCurrentImage().src).toBe(
        "https://example.com/shot-2.jpg"
      );
    });

    it("advances to the next index when Next is clicked", async () => {
      await actions.clickNext();
      expect(onIndexChange).toHaveBeenCalledWith(2);
    });

    it("goes to the previous index when Previous is clicked", async () => {
      await actions.clickPrev();
      expect(onIndexChange).toHaveBeenCalledWith(0);
    });

    it("advances on the ArrowRight key", async () => {
      await actions.pressRight();
      expect(onIndexChange).toHaveBeenCalledWith(2);
    });

    it("goes back on the ArrowLeft key", async () => {
      await actions.pressLeft();
      expect(onIndexChange).toHaveBeenCalledWith(0);
    });

    it("jumps to a thumbnail when its strip button is clicked", async () => {
      await actions.jumpToThumbnail(3);
      expect(onIndexChange).toHaveBeenCalledWith(2);
    });

    it("closes on the Close button", async () => {
      await actions.clickClose();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("closes on the Escape key", async () => {
      await actions.pressEscape();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("given it is open at the last index", () => {
    beforeEach(() => {
      render(
        <ImageLightbox
          images={images}
          open
          index={2}
          onOpenChange={onOpenChange}
          onIndexChange={onIndexChange}
        />
      );
    });

    it("wraps to the first index when advancing past the end", async () => {
      await actions.clickNext();
      expect(onIndexChange).toHaveBeenCalledWith(0);
    });
  });

  describe("given it is open at the first index", () => {
    beforeEach(() => {
      render(
        <ImageLightbox
          images={images}
          open
          index={0}
          onOpenChange={onOpenChange}
          onIndexChange={onIndexChange}
        />
      );
    });

    it("wraps to the last index when going before the start", async () => {
      await actions.clickPrev();
      expect(onIndexChange).toHaveBeenCalledWith(2);
    });
  });

  describe("given it is closed", () => {
    beforeEach(() => {
      render(
        <ImageLightbox
          images={images}
          open={false}
          index={1}
          onOpenChange={onOpenChange}
          onIndexChange={onIndexChange}
        />
      );
    });

    it("renders no image", () => {
      expect(elements.queryCurrentImage()).toBeNull();
    });
  });
});
