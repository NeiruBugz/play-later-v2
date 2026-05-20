/**
 * RED component test for UnfollowUserButton (Slice 20 — social graph).
 *
 * This file is intentionally failing at module resolution:
 * `./unfollow-user-button` does not exist yet — the component is created in
 * the GREEN step (tasks.md line 405). Do NOT implement the component here.
 *
 * `../../api/unfollow-user-fn` also does not exist — RED import.
 *
 * =========================================================================
 * Contracts locked by this test
 * =========================================================================
 *
 * Component export:
 *   `UnfollowUserButton` — named export from `./unfollow-user-button`
 *
 * Props (locked):
 *   profileUserId:   string        — the user being unfollowed
 *   profileUsername: string        — display username for accessible label
 *   viewerUserId:    string | null — the signed-in viewer (null = anonymous)
 *   isFollowing:     boolean       — current follow state (parent-computed)
 *
 * Render contract (locked):
 *   - own-profile view (viewerUserId === profileUserId): returns null — no button rendered
 *   - not-following view (isFollowing === false, non-self): returns null — FollowUserButton owns that state
 *   - following view (isFollowing === true, non-self): renders <button name="Unfollow @alice">
 *   - anonymous viewer (viewerUserId === null): returns null — no button rendered
 *
 * Server-fn call contract (locked):
 *   - clicking the Unfollow button calls unfollowUserFn({ data: { targetUserId: profileUserId } })
 *
 * Accessible name (locked):
 *   `"Unfollow @<username>"` — exact string, no regex.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { unfollowUserFn } from "../../api/unfollow-user-fn";
// RED import — this module does not exist until the GREEN step.
import { UnfollowUserButton } from "./unfollow-user-button";

// --- Server fn mock (mirrors add-game-modal precedent) ---------------------
vi.mock("../../api/unfollow-user-fn", () => ({
  unfollowUserFn: vi.fn(),
}));

// --- Sonner mock -----------------------------------------------------------
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
  isFollowing: true,
};

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  queryUnfollowButton: () =>
    screen.queryByRole("button", { name: `Unfollow @${PROFILE_USERNAME}` }),
  getUnfollowButton: () =>
    screen.getByRole("button", { name: `Unfollow @${PROFILE_USERNAME}` }),
};

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

const actions = {
  clickUnfollow: () => userEvent.click(elements.getUnfollowButton()),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UnfollowUserButton", () => {
  beforeEach(() => {
    vi.mocked(unfollowUserFn).mockReset();
  });

  // ---- Own-profile: button hidden -------------------------------------------

  describe("given viewerUserId equals profileUserId (own-profile view)", () => {
    beforeEach(() => {
      render(
        <UnfollowUserButton
          {...baseProps}
          viewerUserId={PROFILE_ID}
          profileUserId={PROFILE_ID}
        />
      );
    });

    it("does not render a follow or unfollow button on own profile", () => {
      expect(elements.queryUnfollowButton()).toBeNull();
      expect(
        screen.queryByRole("button", { name: /follow|unfollow/i })
      ).toBeNull();
    });
  });

  // ---- Anonymous viewer: button hidden --------------------------------------

  describe("given viewerUserId is null (anonymous viewer)", () => {
    beforeEach(() => {
      render(
        <UnfollowUserButton
          {...baseProps}
          viewerUserId={null}
          isFollowing={true}
        />
      );
    });

    it("does not render an unfollow button for anonymous viewers", () => {
      expect(elements.queryUnfollowButton()).toBeNull();
    });
  });

  // ---- Not following: button hidden (FollowUserButton owns this state) ------

  describe("given isFollowing is false", () => {
    beforeEach(() => {
      render(<UnfollowUserButton {...baseProps} isFollowing={false} />);
    });

    it("does not render an Unfollow button when not following", () => {
      expect(elements.queryUnfollowButton()).toBeNull();
    });
  });

  // ---- Following: Unfollow button shown -------------------------------------

  describe("given isFollowing is true and viewer is not the profile owner", () => {
    beforeEach(() => {
      render(<UnfollowUserButton {...baseProps} isFollowing={true} />);
    });

    it("renders the Unfollow button with the locked accessible name", () => {
      expect(elements.queryUnfollowButton()).not.toBeNull();
    });
  });

  // ---- Click fires unfollowUserFn with { data: { targetUserId } } ----------

  describe("given the Unfollow button is rendered and the user clicks it", () => {
    beforeEach(async () => {
      vi.mocked(toast.success).mockReset();
      vi.mocked(toast.error).mockReset();
      invalidateMock.mockReset();
      vi.mocked(unfollowUserFn).mockResolvedValue(undefined as never);
      render(<UnfollowUserButton {...baseProps} isFollowing={true} />);
      await actions.clickUnfollow();
    });

    it("calls unfollowUserFn with the locked { data } envelope", async () => {
      await waitFor(() => {
        expect(vi.mocked(unfollowUserFn)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(unfollowUserFn)).toHaveBeenCalledWith({
        data: { targetUserId: PROFILE_ID },
      });
    });

    it("fires the locked success toast with the username", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
          `Unfollowed @${PROFILE_USERNAME}`
        );
      });
    });

    it("invalidates the router so the loader re-runs", async () => {
      await waitFor(() => {
        expect(invalidateMock).toHaveBeenCalledOnce();
      });
    });
  });

  // ---- Click rejects → toast.error with err.message ------------------------

  describe("given unfollowUserFn rejects with an Error", () => {
    beforeEach(async () => {
      vi.mocked(toast.success).mockReset();
      vi.mocked(toast.error).mockReset();
      invalidateMock.mockReset();
      vi.mocked(unfollowUserFn).mockRejectedValue(new Error("upstream-down"));
      render(<UnfollowUserButton {...baseProps} isFollowing={true} />);
      await actions.clickUnfollow();
    });

    it("fires toast.error with the err.message verbatim", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith("upstream-down");
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
