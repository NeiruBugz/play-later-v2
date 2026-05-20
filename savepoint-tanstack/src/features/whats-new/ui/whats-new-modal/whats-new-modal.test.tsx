/**
 * RED component test for WhatsNewModal (Slice 20 — what's-new feature).
 *
 * This file is intentionally failing at module resolution:
 * `./whats-new-modal` does not exist yet — the component is created in
 * the GREEN step (tasks.md line 403). Do NOT implement the component here.
 *
 * `../../config` also does not exist — RED import.
 *
 * =========================================================================
 * Contracts locked by this test
 * =========================================================================
 *
 * Component export:
 *   `WhatsNewModal` — named export from `./whats-new-modal`
 *
 * Config export (from `../../config`):
 *   `CURRENT_VERSION` — string constant (e.g. "1.0.0")
 *   `WHATS_NEW_STORAGE_KEY` — string constant (e.g. "whatsNewLastSeenVersion")
 *
 * Open trigger contract (locked):
 *   - on mount, if localStorage does not contain WHATS_NEW_STORAGE_KEY, the modal opens
 *   - on mount, if localStorage[WHATS_NEW_STORAGE_KEY] !== CURRENT_VERSION, the modal opens
 *   - on mount, if localStorage[WHATS_NEW_STORAGE_KEY] === CURRENT_VERSION, the modal does NOT open
 *
 * Dismiss contract (locked):
 *   - a button with accessible name "Got it" is visible when the modal is open
 *   - clicking "Got it" writes localStorage.setItem(WHATS_NEW_STORAGE_KEY, CURRENT_VERSION)
 *   - clicking "Got it" closes the modal (the button disappears)
 *
 * Note on fake timers:
 *   The unit setup (test/setup/unit.ts) installs vi.useFakeTimers() with
 *   shouldAdvanceTime: true. If WhatsNewModal uses a setTimeout delay before
 *   opening (canonical uses 1000ms), tests use vi.runAllTimers() to advance past it.
 *   GREEN agent: if implementing a delay, it must be ≤ the timer pool configured
 *   in vitest.config.ts. Prefer no delay (or a configurable delay) to keep tests simple.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { CURRENT_VERSION, WHATS_NEW_STORAGE_KEY } from "../../config";
// RED import — this module does not exist until the GREEN step.
import { WhatsNewModal } from "./whats-new-modal";

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

// jsdom provides a real localStorage in the jsdom environment.
// We clear it before each test so tests are isolated.

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  queryDismissButton: () => screen.queryByRole("button", { name: "Got it" }),
  getDismissButton: () => screen.getByRole("button", { name: "Got it" }),
  queryModalHeading: () => screen.queryByRole("dialog"),
};

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

const actions = {
  clickGotIt: () => userEvent.click(elements.getDismissButton()),
  // Advance all pending timers (e.g. open-delay setTimeout).
  drainTimers: () => vi.runAllTimers(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("WhatsNewModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ---- Opens when localStorage is empty ------------------------------------

  describe("given localStorage has no stored version (first visit)", () => {
    beforeEach(() => {
      render(<WhatsNewModal />);
      // Drain any open-delay timers the component may install.
      actions.drainTimers();
    });

    it("opens the modal", () => {
      expect(elements.queryDismissButton()).not.toBeNull();
    });
  });

  // ---- Opens when localStorage has a stale version -------------------------

  describe("given localStorage contains a stale version", () => {
    beforeEach(() => {
      localStorage.setItem(WHATS_NEW_STORAGE_KEY, "0.0.0-stale");
      render(<WhatsNewModal />);
      actions.drainTimers();
    });

    it("opens the modal for a user who last saw an older version", () => {
      expect(elements.queryDismissButton()).not.toBeNull();
    });
  });

  // ---- Does NOT open when localStorage version matches current --------------

  describe("given localStorage contains the current version", () => {
    beforeEach(() => {
      localStorage.setItem(WHATS_NEW_STORAGE_KEY, CURRENT_VERSION);
      render(<WhatsNewModal />);
      actions.drainTimers();
    });

    it("does not open the modal when the user has already seen this version", () => {
      expect(elements.queryDismissButton()).toBeNull();
    });
  });

  // ---- Dismiss writes localStorage and closes the modal --------------------

  describe("given the modal is open and the user clicks Got it", () => {
    beforeEach(async () => {
      // Modal is open (localStorage is empty).
      render(<WhatsNewModal />);
      actions.drainTimers();
      // Ensure the modal is open before interacting.
      await waitFor(() => {
        expect(elements.queryDismissButton()).not.toBeNull();
      });
      await actions.clickGotIt();
    });

    it("writes CURRENT_VERSION to localStorage under WHATS_NEW_STORAGE_KEY", () => {
      expect(localStorage.getItem(WHATS_NEW_STORAGE_KEY)).toBe(CURRENT_VERSION);
    });

    it("closes the modal after dismissal (Got it button disappears)", () => {
      expect(elements.queryDismissButton()).toBeNull();
    });
  });
});
