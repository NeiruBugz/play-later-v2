import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GamePrompts } from "./game-prompts";
import type { GamePromptsProps } from "./game-prompts.type";

const mocks = vi.hoisted(() => ({
  answerPromptFn: vi.fn(),
  dismissPromptFn: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mocks.invalidate }),
}));
vi.mock("../../api/answer-prompt-fn", () => ({
  answerPromptFn: mocks.answerPromptFn,
}));
vi.mock("../../api/dismiss-prompt-fn", () => ({
  dismissPromptFn: mocks.dismissPromptFn,
}));

const WHY = "Why do you want to play this?";
const STAYED = "What stayed with you?";

const elements = {
  queryWhy: () => screen.queryByLabelText(WHY),
  getWhy: () => screen.getByLabelText(WHY),
  queryStayed: () => screen.queryByLabelText(STAYED),
  getSave: () => screen.getByRole("button", { name: "Save" }),
  getDismiss: () => screen.getByRole("button", { name: /^Dismiss/ }),
};

function renderPrompts(props: Partial<GamePromptsProps> = {}) {
  return render(
    <GamePrompts
      libraryItemId={4}
      gameTitle="Hades"
      status="WANT"
      prompts={{ why: true, stayed: false }}
      {...props}
    />
  );
}

describe("GamePrompts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.answerPromptFn.mockResolvedValue({ noteId: "n1" });
    mocks.dismissPromptFn.mockResolvedValue({});
  });

  it("shows the why field for a Want game", () => {
    renderPrompts();
    expect(elements.getWhy()).toBeDefined();
    expect(elements.queryStayed()).toBeNull();
  });

  it("shows the stayed field for a Done game", () => {
    renderPrompts({ status: "DONE", prompts: { why: false, stayed: true } });
    expect(elements.queryWhy()).toBeNull();
    expect(screen.getByLabelText(STAYED)).toBeDefined();
  });

  it("shows nothing for a Playing game", () => {
    renderPrompts({ status: "PLAYING" });
    expect(elements.queryWhy()).toBeNull();
  });

  it("shows nothing when no flag is set", () => {
    renderPrompts({ prompts: { why: false, stayed: false } });
    expect(elements.queryWhy()).toBeNull();
  });

  describe("when the user types an answer and presses Enter", () => {
    beforeEach(async () => {
      renderPrompts();
      await userEvent.type(elements.getWhy(), "Heard it is great{Enter}");
    });

    it("saves the answer and hides the prompt", async () => {
      await waitFor(() => expect(elements.queryWhy()).toBeNull());
      expect(mocks.answerPromptFn).toHaveBeenCalledWith({
        data: { id: 4, kind: "WHY", text: "Heard it is great" },
      });
      expect(mocks.invalidate).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the user taps Save", () => {
    it("saves the answer", async () => {
      renderPrompts();
      await userEvent.type(elements.getWhy(), "Looks fun");
      await userEvent.click(elements.getSave());
      await waitFor(() => expect(elements.queryWhy()).toBeNull());
      expect(mocks.answerPromptFn).toHaveBeenCalledTimes(1);
    });
  });

  it("does not save an empty answer", async () => {
    renderPrompts();
    await userEvent.type(elements.getWhy(), "{Enter}");
    expect(mocks.answerPromptFn).not.toHaveBeenCalled();
    expect(elements.getSave()).toBeDisabled();
  });

  describe("when the user taps the dismiss button", () => {
    it("dismisses the prompt for good", async () => {
      renderPrompts();
      await userEvent.click(elements.getDismiss());
      await waitFor(() => expect(elements.queryWhy()).toBeNull());
      expect(mocks.dismissPromptFn).toHaveBeenCalledWith({
        data: { id: 4, kind: "WHY" },
      });
      expect(mocks.answerPromptFn).not.toHaveBeenCalled();
    });
  });

  describe("given the answer cannot be saved", () => {
    beforeEach(async () => {
      mocks.answerPromptFn.mockRejectedValue(new Error("boom"));
      renderPrompts();
      await userEvent.type(elements.getWhy(), "Looks fun{Enter}");
    });

    it("keeps the text, shows the copy and does not refresh", async () => {
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Couldn't save. Try again."
      );
      expect(elements.getWhy()).toHaveValue("Looks fun");
      expect(mocks.invalidate).not.toHaveBeenCalled();
    });
  });
});
