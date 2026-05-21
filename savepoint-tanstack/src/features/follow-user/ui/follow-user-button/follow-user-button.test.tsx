/**
 * RED component test for FollowUserButton (Slice 20 — social graph).
 *
 * This file is intentionally failing at module resolution:
 * `./follow-user-button` does not exist yet — the component is created in
 * the GREEN step (tasks.md line 405). Do NOT implement the component here.
 *
 * `../../api/follow-user-fn` also does not exist — RED import.
 *
 * =========================================================================
 * Contracts locked by this test
 * =========================================================================
 *
 * Component export:
 *   `FollowUserButton` — named export from `./follow-user-button`
 *
 * Props (locked):
 *   profileUserId:   string        — the user being followed
 *   profileUsername: string        — display username for accessible label
 *   viewerUserId:    string | null — the signed-in viewer (null = anonymous)
 *   isFollowing:     boolean       — current follow state (parent-computed)
 *
 * Render contract (locked):
 *   - own-profile view (viewerUserId === profileUserId): returns null — no button rendered
 *   - not-following view (isFollowing === false, non-self): renders <button name="Follow @alice">
 *   - following view (isFollowing === true, non-self): returns null — UnfollowUserButton owns that state
 *   - anonymous viewer (viewerUserId === null): returns null — no button rendered
 *
 * Server-fn call contract (locked):
 *   - clicking the Follow button calls followUserFn({ data: { targetUserId: profileUserId } })
 *
 * Accessible name (locked):
 *   `"Follow @<username>"` — exact string, no regex.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// Pull the mocked toast for assertions.
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { followUserFn } from "../../api/follow-user-fn";
// RED import — this module does not exist until the GREEN step.
import { FollowUserButton } from "./follow-user-button";

// --- Server fn mock (mirrors add-game-modal precedent) ---------------------
vi.mock("../../api/follow-user-fn", () => ({
  followUserFn: vi.fn(),
}));

// --- Sonner mock (mirrors add-game-modal precedent) ------------------------
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// --- Router mock (mirrors add-game-modal precedent) ------------------------
const invalidateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: invalidateMock }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VIEWER_ID = "viewer-user-abc";
const PROFILE_ID = "profile-user-xyz";
const PROFILE_USERNAME = "alice";

const baseProps = {
  profileUserId: PROFILE_ID,
  profileUsername: PROFILE_USERNAME,
  viewerUserId: VIEWER_ID,
  isFollowing: false,
};

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  queryFollowButton: () =>
    screen.queryByRole("button", { name: `Follow @${PROFILE_USERNAME}` }),
  getFollowButton: () =>
    screen.getByRole("button", { name: `Follow @${PROFILE_USERNAME}` }),
};

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

const actions = {
  clickFollow: () => userEvent.click(elements.getFollowButton()),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FollowUserButton", () => {
  beforeEach(() => {
    vi.mocked(followUserFn).mockReset();
  });

  // ---- Own-profile: button hidden -------------------------------------------

  describe("given viewerUserId equals profileUserId (own-profile view)", () => {
    beforeEach(() => {
      render(
        <FollowUserButton
          {...baseProps}
          viewerUserId={PROFILE_ID}
          profileUserId={PROFILE_ID}
        />
      );
    });

    it("does not render a follow or unfollow button on own profile", () => {
      expect(elements.queryFollowButton()).toBeNull();
      expect(
        screen.queryByRole("button", { name: `Follow @${PROFILE_USERNAME}` })
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: `Unfollow @${PROFILE_USERNAME}` })
      ).toBeNull();
    });
  });

  // ---- Anonymous viewer: button hidden --------------------------------------

  describe("given viewerUserId is null (anonymous viewer)", () => {
    beforeEach(() => {
      render(
        <FollowUserButton
          {...baseProps}
          viewerUserId={null}
          isFollowing={false}
        />
      );
    });

    it("does not render a follow button for anonymous viewers", () => {
      expect(elements.queryFollowButton()).toBeNull();
    });
  });

  // ---- Not following: Follow button shown -----------------------------------

  describe("given isFollowing is false and viewer is not the profile owner", () => {
    beforeEach(() => {
      render(<FollowUserButton {...baseProps} isFollowing={false} />);
    });

    it("renders the Follow button with the locked accessible name", () => {
      expect(elements.queryFollowButton()).not.toBeNull();
    });
  });

  // ---- Following: button hidden (UnfollowUserButton owns this state) --------

  describe("given isFollowing is true", () => {
    beforeEach(() => {
      render(<FollowUserButton {...baseProps} isFollowing={true} />);
    });

    it("does not render a Follow button when already following", () => {
      expect(elements.queryFollowButton()).toBeNull();
    });
  });

  // ---- Click fires followUserFn with { data: { targetUserId } } ------------

  describe("given the Follow button is rendered and the user clicks it", () => {
    beforeEach(async () => {
      vi.mocked(toast.success).mockReset();
      vi.mocked(toast.error).mockReset();
      invalidateMock.mockReset();
      vi.mocked(followUserFn).mockResolvedValue(undefined as never);
      render(<FollowUserButton {...baseProps} isFollowing={false} />);
      await actions.clickFollow();
    });

    it("calls followUserFn with the locked { data } envelope", async () => {
      await waitFor(() => {
        expect(vi.mocked(followUserFn)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(followUserFn)).toHaveBeenCalledWith({
        data: { targetUserId: PROFILE_ID },
      });
    });

    it("fires the locked success toast with the username", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
          `Following @${PROFILE_USERNAME}`
        );
      });
    });

    it("invalidates the router so the loader re-runs and isFollowing flips", async () => {
      await waitFor(() => {
        expect(invalidateMock).toHaveBeenCalledOnce();
      });
    });
  });

  // ---- Click rejects → toast.error with err.message ------------------------

  describe("given followUserFn rejects with an Error", () => {
    beforeEach(async () => {
      vi.mocked(toast.success).mockReset();
      vi.mocked(toast.error).mockReset();
      invalidateMock.mockReset();
      vi.mocked(followUserFn).mockRejectedValue(new Error("rate-limited"));
      render(<FollowUserButton {...baseProps} isFollowing={false} />);
      await actions.clickFollow();
    });

    it("fires toast.error with the err.message verbatim", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith("rate-limited");
      });
    });

    it("does not fire toast.success on rejection", () => {
      expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
    });

    it("does not invalidate the router on rejection", () => {
      expect(invalidateMock).not.toHaveBeenCalled();
    });
  });
});
