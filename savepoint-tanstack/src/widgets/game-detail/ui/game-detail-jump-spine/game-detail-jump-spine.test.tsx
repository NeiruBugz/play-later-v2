import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GameDetailJumpSpine } from "./game-detail-jump-spine";

const elements = {
  querySpineContainer: () => screen.queryByTestId("game-detail-jump-spine"),
  queryButton: (label: string) => screen.queryByRole("button", { name: label }),
  queryAllButtons: () => screen.queryAllByRole("button"),
};

const actions = {
  clickSection: async (label: string) => {
    await userEvent.click(elements.queryButton(label)!);
  },
};

describe("GameDetailJumpSpine", () => {
  describe("given sections [Playthroughs, About, Journal]", () => {
    beforeEach(() => {
      render(
        <GameDetailJumpSpine
          sections={[
            { id: "playthroughs", label: "Playthroughs" },
            { id: "about", label: "About" },
            { id: "journal", label: "Journal" },
          ]}
        />
      );
    });

    it("renders all three section labels as interactive elements", () => {
      expect(elements.queryButton("Playthroughs")).not.toBeNull();
      expect(elements.queryButton("About")).not.toBeNull();
      expect(elements.queryButton("Journal")).not.toBeNull();
    });

    it("has a sticky container", () => {
      const container = elements.querySpineContainer();
      expect(container).not.toBeNull();
      expect(container!.className).toContain("sticky");
    });
  });

  describe("given the user taps About", () => {
    const mockScrollIntoView = vi.fn();
    const mockGetElementById = vi.spyOn(document, "getElementById");

    beforeEach(async () => {
      mockScrollIntoView.mockReset();
      mockGetElementById.mockReset();
      mockGetElementById.mockReturnValue({
        scrollIntoView: mockScrollIntoView,
      } as unknown as HTMLElement);

      render(
        <GameDetailJumpSpine
          sections={[
            { id: "playthroughs", label: "Playthroughs" },
            { id: "about", label: "About" },
            { id: "journal", label: "Journal" },
          ]}
        />
      );

      await actions.clickSection("About");
    });

    it("calls scrollIntoView on the #about element", () => {
      expect(mockGetElementById).toHaveBeenCalledWith("about");
      expect(mockScrollIntoView).toHaveBeenCalled();
    });
  });

  describe("given an empty sections array", () => {
    beforeEach(() => {
      render(<GameDetailJumpSpine sections={[]} />);
    });

    it("renders no interactive buttons", () => {
      expect(elements.queryAllButtons()).toHaveLength(0);
    });
  });
});
