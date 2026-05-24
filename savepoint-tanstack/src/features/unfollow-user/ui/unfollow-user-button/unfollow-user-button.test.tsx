import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { unfollowUserFn } from "../../api/unfollow-user-fn";
import { UnfollowUserButton } from "./unfollow-user-button";

vi.mock("../../api/unfollow-user-fn", () => ({
  unfollowUserFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const invalidateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: invalidateMock }),
}));

const VIEWER_ID = "viewer-user-abc";
const PROFILE_ID = "profile-user-xyz";
const PROFILE_USERNAME = "alice";

const baseProps = {
  profileUserId: PROFILE_ID,
  profileUsername: PROFILE_USERNAME,
  viewerUserId: VIEWER_ID,
  isFollowing: true,
};

const elements = {
  queryUnfollowButton: () =>
    screen.queryByRole("button", { name: `Unfollow @${PROFILE_USERNAME}` }),
  getUnfollowButton: () =>
    screen.getByRole("button", { name: `Unfollow @${PROFILE_USERNAME}` }),
};

const actions = {
  clickUnfollow: () => userEvent.click(elements.getUnfollowButton()),
};

describe("UnfollowUserButton", () => {
  beforeEach(() => {
    vi.mocked(unfollowUserFn).mockReset();
  });

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
        screen.queryByRole("button", { name: `Follow @${PROFILE_USERNAME}` })
      ).toBeNull();
      expect(
        screen.queryByRole("button", { name: `Unfollow @${PROFILE_USERNAME}` })
      ).toBeNull();
    });
  });

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

  describe("given isFollowing is false", () => {
    beforeEach(() => {
      render(<UnfollowUserButton {...baseProps} isFollowing={false} />);
    });

    it("does not render an Unfollow button when not following", () => {
      expect(elements.queryUnfollowButton()).toBeNull();
    });
  });

  describe("given isFollowing is true and viewer is not the profile owner", () => {
    beforeEach(() => {
      render(<UnfollowUserButton {...baseProps} isFollowing={true} />);
    });

    it("renders the Unfollow button with the locked accessible name", () => {
      expect(elements.queryUnfollowButton()).not.toBeNull();
    });
  });

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
