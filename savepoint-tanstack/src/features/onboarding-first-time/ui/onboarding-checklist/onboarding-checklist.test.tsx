/**
 * RED component test for OnboardingChecklist (Slice 20 — first-time onboarding).
 *
 * This file is intentionally failing at module resolution:
 * `./onboarding-checklist` does not exist yet — the component is created in
 * the GREEN step (tasks.md line 404). Do NOT implement the component here.
 *
 * =========================================================================
 * Contracts locked by this test
 * =========================================================================
 *
 * Component export:
 *   `OnboardingChecklist` — named export from `./onboarding-checklist`
 *
 * Props (locked):
 *   libraryItemCount:  number        — number of games in library (step 1 signal)
 *   journalEntryCount: number        — number of journal entries (step 2 signal)
 *   userImage:         string | null — user avatar URL (step 3 signal)
 *   userSteamId:       string | null — Steam ID (step 4 signal; maps to `steamId64` in DB)
 *
 * Step definitions (locked, 4 steps):
 *   1. "Add your first game"    — done iff libraryItemCount > 0
 *   2. "Write a journal entry"  — done iff journalEntryCount > 0
 *   3. "Set up your profile"    — done iff userImage is not null/empty
 *   4. "Connect Steam"          — done iff userSteamId is not null/empty
 *                                 OR localStorage "onboardingSteamDismissed" === "1"
 *
 * Render contract (locked):
 *   - each step is rendered as a <li> with role="listitem"
 *   - each <li> contains the step label text
 *   - a done step has a visible checkmark icon (aria-label "Done" OR role="img" OR
 *     data-testid="step-done-icon" — GREEN agent must pick one and match it)
 *   - an undone step does NOT have a checkmark icon
 *
 * Completion-mark persistence (locked):
 *   - when ALL 4 steps are done, the component returns null (hidden)
 *   - when returning null it FIRST writes localStorage "onboardingComplete" = "1"
 *   - if "onboardingComplete" === "1" in localStorage on mount, the component returns null
 *     immediately without rendering
 *
 * Accessible name for the step-done indicator (binding for GREEN):
 *   aria-label "Done" on an icon element (e.g. <svg aria-label="Done">).
 *   Alternative: role="img" with aria-label="Done".
 *   GREEN agent MUST use `aria-label="Done"` so tests can assert via
 *   `screen.getAllByRole("img", { name: "Done" })` or `screen.getByLabelText("Done")`.
 *
 * Schema note for GREEN agent:
 *   The Prisma schema (savepoint-tanstack/prisma/schema.prisma) uses `steamId64`
 *   (not `steamId`). The component prop is named `userSteamId` to match the
 *   task decision's spec. The loader/parent that constructs props maps
 *   `user.steamId64 → userSteamId`. Do NOT rename the DB column.
 */

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { OnboardingChecklist } from "./onboarding-checklist";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OnboardingChecklist", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ---- Initial render: all steps undone -------------------------------------

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

  // ---- Partial completion: mixed done/undone --------------------------------

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

  // ---- Step 4: steamDismissed flag counts as done ---------------------------

  describe("given userSteamId is null but onboardingSteamDismissed is set in localStorage", () => {
    beforeEach(() => {
      localStorage.setItem("onboardingSteamDismissed", "1");
      render(<OnboardingChecklist {...ALL_UNDONE_PROPS} userSteamId={null} />);
    });

    it("marks the Connect Steam step as done via localStorage flag", () => {
      // Exactly 1 done icon (step 4) when all others are undone.
      expect(elements.getAllDoneIcons()).toHaveLength(1);
    });
  });

  // ---- All done: checklist hides and writes localStorage -------------------

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

  // ---- Already complete: hidden on mount -----------------------------------

  describe("given onboardingComplete is already set in localStorage", () => {
    beforeEach(() => {
      localStorage.setItem("onboardingComplete", "1");
      render(<OnboardingChecklist {...ALL_UNDONE_PROPS} />);
    });

    it("returns null immediately without rendering any step items", () => {
      expect(elements.queryChecklist()).toBeNull();
    });
  });

  // ---- localStorage.getItem throws (catch branch in readLocalStorageFlag) --

  describe("given localStorage.getItem throws (e.g., privacy-mode quota error)", () => {
    beforeEach(() => {
      // Simulate a browser privacy-mode where localStorage access throws.
      vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
        throw new Error("SecurityError: localStorage access denied");
      });
      render(<OnboardingChecklist {...ALL_UNDONE_PROPS} />);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("renders the checklist (readLocalStorageFlag returns false in catch, not throwing)", () => {
      // The catch returns false, so steam is not dismissed and complete flag is false.
      // The checklist should render normally.
      expect(elements.queryChecklist()).not.toBeNull();
    });
  });
});
