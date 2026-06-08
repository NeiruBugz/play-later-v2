import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ScreenshotsPanel } from "./screenshots-panel";

const screenshots = [
  { id: 1, image_id: "abc1" },
  { id: 2, image_id: "abc2" },
  { id: 3, image_id: "abc3" },
];

const elements = {
  queryHeading: () => screen.queryByRole("heading", { name: "Screenshots" }),
  getThumbnail: (n: number) =>
    screen.getByRole("button", { name: `Open screenshot ${n}` }),
  queryLightboxImage: (n: number) =>
    screen.queryByRole("img", { name: `Screenshot ${n}` }),
};

const actions = {
  openThumbnail: (n: number) => userEvent.click(elements.getThumbnail(n)),
};

describe("ScreenshotsPanel", () => {
  describe("given screenshots exist", () => {
    beforeEach(() => {
      render(<ScreenshotsPanel screenshots={screenshots} gameTitle="FF7" />);
    });

    it("renders the Screenshots heading", () => {
      expect(elements.queryHeading()).not.toBeNull();
    });

    it("renders a thumbnail for each screenshot", () => {
      expect(elements.getThumbnail(1)).not.toBeNull();
      expect(elements.getThumbnail(2)).not.toBeNull();
      expect(elements.getThumbnail(3)).not.toBeNull();
    });

    it("does not show the lightbox before a thumbnail is clicked", () => {
      expect(elements.queryLightboxImage(1)).toBeNull();
    });

    it("opens the lightbox at the clicked thumbnail's index", async () => {
      await actions.openThumbnail(2);
      expect(elements.queryLightboxImage(2)).not.toBeNull();
    });
  });

  describe("given an empty screenshots array", () => {
    beforeEach(() => {
      render(<ScreenshotsPanel screenshots={[]} gameTitle="FF7" />);
    });

    it("renders nothing", () => {
      expect(elements.queryHeading()).toBeNull();
    });
  });

  describe("given screenshots are undefined", () => {
    beforeEach(() => {
      render(<ScreenshotsPanel screenshots={undefined} gameTitle="FF7" />);
    });

    it("renders nothing", () => {
      expect(elements.queryHeading()).toBeNull();
    });
  });
});
