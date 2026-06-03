import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { YourRecordPanel } from "./your-record-panel";

const invalidate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate }),
}));

const updateLibraryItemFn = vi.fn();

vi.mock("@/features/manage-library-entry/api/update-library-item-fn", () => ({
  updateLibraryItemFn: (args: unknown) => updateLibraryItemFn(args),
}));

const onLogSession = vi.fn();

const elements = {
  queryHeading: () => screen.queryByText("// YOUR RECORD"),
  queryPlaytimeTerm: () => screen.queryByText("Playtime"),
  queryPlaytimeValue: () => screen.queryByText("3h"),
  querySessionsTerm: () => screen.queryByText("Sessions"),
  querySessionsValue: () => screen.queryByText("7"),
  getRatingStar: (n: number) => screen.getByTestId(`rating-star-${n}`),
  queryRating: () => screen.queryByRole("slider"),
  queryReadOnlyRating: () => screen.queryByRole("img", { name: /rating/i }),
  getLogSessionButton: () =>
    screen.getByRole("button", { name: "Log a session" }),
};

const actions = {
  clickFourthStar: async () => {
    await userEvent.click(elements.getRatingStar(4));
  },
  clickLogSession: async () => {
    await userEvent.click(elements.getLogSessionButton());
  },
};

describe("YourRecordPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateLibraryItemFn.mockResolvedValue({
      id: 1,
      rating: 8,
      gameId: "game-1",
    });
  });

  describe("given an in-library game with logged time and sessions", () => {
    beforeEach(() => {
      render(
        <YourRecordPanel
          itemId={1}
          rating={null}
          playtimeTotalMinutes={180}
          journalCount={7}
          gameTitle="Hollow Knight"
          onLogSession={onLogSession}
        />
      );
    });

    it("renders the YOUR RECORD heading", () => {
      expect(elements.queryHeading()).not.toBeNull();
    });

    it("shows the playtime in hours", () => {
      expect(elements.queryPlaytimeTerm()).not.toBeNull();
      expect(elements.queryPlaytimeValue()).not.toBeNull();
    });

    it("shows the sessions count from journalCount", () => {
      expect(elements.querySessionsTerm()).not.toBeNull();
      expect(elements.querySessionsValue()).not.toBeNull();
    });

    it("renders an interactive rating control", () => {
      expect(elements.queryRating()).not.toBeNull();
    });

    it("submits a rating change via the mutation", async () => {
      await actions.clickFourthStar();
      expect(updateLibraryItemFn).toHaveBeenCalledTimes(1);
      expect(updateLibraryItemFn).toHaveBeenCalledWith({
        data: { itemId: 1, rating: 8 },
      });
    });

    it("invokes onLogSession when the log button is clicked", async () => {
      await actions.clickLogSession();
      expect(onLogSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("given no logged time", () => {
    beforeEach(() => {
      render(
        <YourRecordPanel
          itemId={1}
          rating={null}
          playtimeTotalMinutes={0}
          journalCount={2}
          gameTitle="Hollow Knight"
          onLogSession={onLogSession}
        />
      );
    });

    it("omits the playtime figure entirely", () => {
      expect(elements.queryPlaytimeTerm()).toBeNull();
    });

    it("still shows the sessions count", () => {
      expect(elements.querySessionsTerm()).not.toBeNull();
    });
  });

  describe("given the game is not in the library", () => {
    beforeEach(() => {
      render(
        <YourRecordPanel
          itemId={null}
          rating={null}
          playtimeTotalMinutes={0}
          journalCount={0}
          gameTitle="Hollow Knight"
          onLogSession={onLogSession}
        />
      );
    });

    it("does not render an interactive rating control", () => {
      expect(elements.queryRating()).toBeNull();
    });
  });
});
