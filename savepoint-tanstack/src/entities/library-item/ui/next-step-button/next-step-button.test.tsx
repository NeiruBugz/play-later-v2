import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";
import { NextStepButton } from "./next-step-button";

const onStep = vi.fn();

const elements = {
  getButton: (name: string) => screen.getByRole("button", { name }),
};

describe("NextStepButton", () => {
  beforeEach(() => {
    onStep.mockClear();
  });

  describe.each([
    ["WANT", "Start playing", "PLAYING"],
    ["PLAYING", "Mark done", "DONE"],
    ["DONE", "Play again", "PLAYING"],
  ] as const)("given a %s item", (status: LibraryItemStatus, label, target) => {
    beforeEach(async () => {
      render(<NextStepButton status={status} onStep={onStep} />);
      await userEvent.click(elements.getButton(label));
    });

    it(`labels the button "${label}" and steps to ${target}`, () => {
      expect(onStep).toHaveBeenCalledExactlyOnceWith(target);
    });
  });

  describe("given any status", () => {
    beforeEach(() => {
      render(<NextStepButton status="WANT" onStep={onStep} />);
    });

    it("is not the screen's primary action", () => {
      expect(elements.getButton("Start playing")).not.toHaveClass("bg-primary");
    });
  });

  describe("given it is disabled", () => {
    beforeEach(async () => {
      render(<NextStepButton status="WANT" onStep={onStep} disabled />);
      await userEvent.click(elements.getButton("Start playing"));
    });

    it("does not step", () => {
      expect(onStep).not.toHaveBeenCalled();
    });
  });
});
