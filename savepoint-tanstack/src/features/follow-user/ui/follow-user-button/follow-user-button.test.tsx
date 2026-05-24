import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { followUserFn } from "../../api/follow-user-fn";
import { FollowUserButton } from "./follow-user-button";

vi.mock("../../api/follow-user-fn", () => ({
  followUserFn: vi.fn(),
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
  isFollowing: false,
};

const elements = {
  queryFollowButton: () =>
    screen.queryByRole("button", { name: `Follow @${PROFILE_USERNAME}` }),
  getFollowButton: () =>
    screen.getByRole("button", { name: `Follow @${PROFILE_USERNAME}` }),
};

const actions = {
  clickFollow: () => userEvent.click(elements.getFollowButton()),
};

describe("FollowUserButton", () => {
  beforeEach(() => {
    vi.mocked(followUserFn).mockReset();
  });

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

  describe("given isFollowing is false and viewer is not the profile owner", () => {
    beforeEach(() => {
      render(<FollowUserButton {...baseProps} isFollowing={false} />);
    });

    it("renders the Follow button with the locked accessible name", () => {
      expect(elements.queryFollowButton()).not.toBeNull();
    });
  });

  describe("given isFollowing is true", () => {
    beforeEach(() => {
      render(<FollowUserButton {...baseProps} isFollowing={true} />);
    });

    it("does not render a Follow button when already following", () => {
      expect(elements.queryFollowButton()).toBeNull();
    });
  });

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
