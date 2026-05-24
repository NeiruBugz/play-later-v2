/**
 * The `userSteamId` prop maps to the `steamId64` column in the Prisma schema;
 * the loader/parent that constructs props maps `user.steamId64 → userSteamId`.
 * Do NOT rename the DB column.
 */

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingChecklist } from "./onboarding-checklist";

const ALL_UNDONE_PROPS = {
  libraryItemCount: 0,
  journalEntryCount: 0,
  userImage: null,
  userSteamId: null,
};

const ALL_DONE_PROPS = {
  libraryItemCount: 1,
  journalEntryCount: 1,
  userImage: "https://example.com/avatar.png",
  userSteamId: "76561198000000001",
};

const PARTIAL_PROPS = {
  libraryItemCount: 1, // step 1 done
  journalEntryCount: 0, // step 2 undone
  userImage: "https://example.com/avatar.png", // step 3 done
  userSteamId: null, // step 4 undone
};

const STEP_LABELS = [
  "Add your first game",
  "Write a journal entry",
  "Set up your profile",
  "Connect Steam",
] as const;

const elements = {
  queryChecklist: () => screen.queryByRole("list"),
  getAllStepItems: () => screen.getAllByRole("listitem"),
  queryStepLabel: (label: string) => screen.queryByText(label),
  getStepLabel: (label: string) => screen.getByText(label),
  getAllDoneIcons: () => screen.getAllByRole("img", { name: "Done" }),
  queryDoneIcons: () => screen.queryAllByRole("img", { name: "Done" }),
};

describe("OnboardingChecklist", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("given all 4 steps are undone", () => {
    beforeEach(() => {
      render(<OnboardingChecklist {...ALL_UNDONE_PROPS} />);
    });

    it("renders the checklist", () => {
      expect(elements.queryChecklist()).not.toBeNull();
    });

    it("renders all 4 step labels", () => {
      for (const label of STEP_LABELS) {
        expect(elements.queryStepLabel(label)).not.toBeNull();
      }
    });

    it("renders 4 list items", () => {
      expect(elements.getAllStepItems()).toHaveLength(4);
    });

    it("renders no done checkmark icons when all steps are undone", () => {
      expect(elements.queryDoneIcons()).toHaveLength(0);
    });
  });

  describe("given steps 1 and 3 are done, steps 2 and 4 are undone", () => {
    beforeEach(() => {
      render(<OnboardingChecklist {...PARTIAL_PROPS} />);
    });

    it("renders exactly 2 done checkmark icons", () => {
      expect(elements.getAllDoneIcons()).toHaveLength(2);
    });

    it("still renders all 4 step labels", () => {
      for (const label of STEP_LABELS) {
        expect(elements.queryStepLabel(label)).not.toBeNull();
      }
    });
  });

  describe("given userSteamId is null but onboardingSteamDismissed is set in localStorage", () => {
    beforeEach(() => {
      localStorage.setItem("onboardingSteamDismissed", "1");
      render(<OnboardingChecklist {...ALL_UNDONE_PROPS} userSteamId={null} />);
    });

    it("marks the Connect Steam step as done via localStorage flag", () => {
      expect(elements.getAllDoneIcons()).toHaveLength(1);
    });
  });

  describe("given all 4 steps are done", () => {
    beforeEach(() => {
      render(<OnboardingChecklist {...ALL_DONE_PROPS} />);
    });

    it("returns null (does not render the checklist) when all steps are complete", () => {
      expect(elements.queryChecklist()).toBeNull();
    });

    it("writes onboardingComplete = '1' to localStorage when all steps are done", () => {
      expect(localStorage.getItem("onboardingComplete")).toBe("1");
    });
  });

  describe("given onboardingComplete is already set in localStorage", () => {
    beforeEach(() => {
      localStorage.setItem("onboardingComplete", "1");
      render(<OnboardingChecklist {...ALL_UNDONE_PROPS} />);
    });

    it("returns null immediately without rendering any step items", () => {
      expect(elements.queryChecklist()).toBeNull();
    });
  });

  describe("given localStorage.getItem throws (e.g., privacy-mode quota error)", () => {
    beforeEach(() => {
      vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
        throw new Error("SecurityError: localStorage access denied");
      });
      render(<OnboardingChecklist {...ALL_UNDONE_PROPS} />);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("renders the checklist (readLocalStorageFlag returns false in catch, not throwing)", () => {
      expect(elements.queryChecklist()).not.toBeNull();
    });
  });
});
