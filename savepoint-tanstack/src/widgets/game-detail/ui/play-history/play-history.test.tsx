import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PlayHistory } from "./play-history";

const THIS_YEAR = new Date().getFullYear();

const plays = [
  {
    id: "older",
    startedAt: new Date(THIS_YEAR, 0, 5),
    finishedAt: new Date(THIS_YEAR, 0, 19),
  },
  {
    id: "newer",
    startedAt: new Date(THIS_YEAR, 2, 3),
    finishedAt: new Date(THIS_YEAR, 2, 20),
  },
];

describe("PlayHistory", () => {
  describe("given no ended plays", () => {
    it("renders nothing", () => {
      const { container } = render(<PlayHistory plays={[]} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("given a play with no recorded start", () => {
    it("shows only the end date", async () => {
      render(
        <PlayHistory
          plays={[
            {
              id: "x",
              startedAt: null,
              finishedAt: new Date(THIS_YEAR, 2, 20),
            },
          ]}
        />
      );
      await userEvent.click(screen.getByRole("button", { name: "History" }));
      expect(screen.getByRole("listitem").textContent).toBe("\u2013 20 Mar");
    });
  });

  describe("given ended plays", () => {
    it("starts collapsed", () => {
      render(<PlayHistory plays={plays} />);
      expect(screen.getByRole("button", { name: "History" })).toHaveAttribute(
        "aria-expanded",
        "false"
      );
      expect(screen.queryByRole("listitem")).toBeNull();
    });

    it("lists the plays newest first as date ranges once expanded", async () => {
      render(<PlayHistory plays={plays} />);
      await userEvent.click(screen.getByRole("button", { name: "History" }));

      const items = screen.getAllByRole("listitem").map((li) => li.textContent);
      expect(items).toEqual(["3 Mar – 20 Mar", "5 Jan – 19 Jan"]);
    });

    it("includes the year for plays from other years", async () => {
      render(
        <PlayHistory
          plays={[
            {
              id: "old",
              startedAt: new Date(2019, 2, 3),
              finishedAt: new Date(2019, 2, 20),
            },
          ]}
        />
      );
      await userEvent.click(screen.getByRole("button", { name: "History" }));

      expect(screen.getByText("3 Mar 2019 – 20 Mar 2019")).toBeInTheDocument();
    });
  });
});
