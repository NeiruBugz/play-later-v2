import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildLibraryItem } from "../../../../../test/factories/builders.ts";
import { GameLibraryControls } from "./game-library-controls";

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
}));
vi.mock("@/entities/session/api/get-session.server", () => ({
  getServerUserId: vi.fn(),
}));
vi.mock("@/features/library-prompts/ui/game-prompts", () => ({
  GamePrompts: ({ status }: { status: string }) => <p>Prompts for {status}</p>,
}));

type StripOptions = {
  status?: "WANT" | "PLAYING" | "DONE";
  upNextPosition?: number | null;
  isOwned?: boolean;
  inLibrary?: boolean;
  prompts?: { why: boolean; stayed: boolean };
};

function renderStrip({
  status = "WANT",
  upNextPosition = null,
  isOwned = true,
  inLibrary = true,
  prompts,
}: StripOptions = {}) {
  render(
    <GameLibraryControls
      igdbId={1}
      gameTitle="Hades"
      entry={
        inLibrary ? buildLibraryItem({ id: 7, status, upNextPosition }) : null
      }
      libraryStatus={
        inLibrary ? { status, setStatus: vi.fn(), isPending: false } : null
      }
      libraryOwnership={
        inLibrary ? { isOwned, setOwned: vi.fn(), isPending: false } : null
      }
      prompts={prompts}
    />
  );
}

const elements = {
  queryQueueMarker: (text: string) => screen.queryByText(text),
  queryNotOwned: () => screen.queryByText("Not owned"),
  queryStatusControl: () =>
    screen.queryByRole("button", { name: /^Status: .*\. Change$/ }),
  queryMoreMenu: () =>
    screen.queryByRole("button", { name: "More library actions" }),
  queryNextStep: () =>
    screen.queryByRole("button", {
      name: /^(Start playing|Mark done|Play again)$/,
    }),
  queryAddButton: () =>
    screen.queryByRole("button", { name: "Add to library" }),
  queryPrompts: (status: string) => screen.queryByText(`Prompts for ${status}`),
};

describe("GameLibraryControls", () => {
  describe("given a queued Want game the user does not own", () => {
    beforeEach(() => {
      renderStrip({ status: "WANT", upNextPosition: 2, isOwned: false });
    });

    it("shows the Up Next position and the Not owned tag", () => {
      expect(elements.queryQueueMarker("Up Next #2")).toBeInTheDocument();
      expect(elements.queryNotOwned()).toBeInTheDocument();
    });

    it("leaves the actions to the header", () => {
      expect(elements.queryStatusControl()).toBeNull();
      expect(elements.queryNextStep()).toBeNull();
      expect(elements.queryMoreMenu()).toBeNull();
    });
  });

  describe("given an owned Want game that is not queued", () => {
    beforeEach(() => {
      renderStrip({ status: "WANT", upNextPosition: null, isOwned: true });
    });

    it("shows neither a queue marker nor the Not owned tag", () => {
      expect(elements.queryQueueMarker("Up Next #2")).toBeNull();
      expect(elements.queryNotOwned()).toBeNull();
    });
  });

  describe("given prompts are offered for a Done game", () => {
    beforeEach(() => {
      renderStrip({
        status: "DONE",
        prompts: { why: false, stayed: true },
      });
    });

    it("shows the prompts", () => {
      expect(elements.queryPrompts("DONE")).toBeInTheDocument();
    });
  });

  describe("given the game is not in the library", () => {
    beforeEach(() => {
      renderStrip({ inLibrary: false });
    });

    it("renders no add action, because the header owns it", () => {
      expect(elements.queryAddButton()).toBeNull();
      expect(elements.queryStatusControl()).toBeNull();
    });
  });
});
