import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { followUserAction } from "../server-actions/follow-user";
import { unfollowUserAction } from "../server-actions/unfollow-user";
import { FollowButton } from "./follow-button";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("../server-actions/follow-user", () => ({
  followUserAction: vi.fn(),
}));

vi.mock("../server-actions/unfollow-user", () => ({
  unfollowUserAction: vi.fn(),
}));

const mockFollowUserAction = vi.mocked(followUserAction);
const mockUnfollowUserAction = vi.mocked(unfollowUserAction);
const mockToastError = vi.mocked(toast.error);

const DEFAULT_PROPS = {
  followingId: "user-123",
  initialIsFollowing: false,
};

describe("FollowButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFollowUserAction.mockResolvedValue({ success: true, data: undefined });
    mockUnfollowUserAction.mockResolvedValue({
      success: true,
      data: undefined,
    });
  });

  describe("given initialIsFollowing is false", () => {
    it("renders the Follow button", () => {
      render(<FollowButton {...DEFAULT_PROPS} />);

      expect(
        screen.getByRole("button", { name: "Follow" })
      ).toBeInTheDocument();
    });
  });

  describe("given initialIsFollowing is true", () => {
    it("renders the Following button", () => {
      render(<FollowButton followingId="user-123" initialIsFollowing={true} />);

      expect(
        screen.getByRole("button", { name: "Following" })
      ).toBeInTheDocument();
    });
  });

  describe("given the user clicks Follow", () => {
    it("calls followUserAction with the followingId", async () => {
      render(<FollowButton {...DEFAULT_PROPS} />);

      await userEvent.click(screen.getByRole("button", { name: "Follow" }));

      await waitFor(() => {
        expect(mockFollowUserAction).toHaveBeenCalledWith({
          followingId: "user-123",
        });
      });
    });

    it("optimistically shows Following before the server responds", async () => {
      let resolveAction!: (
        value: Awaited<ReturnType<typeof followUserAction>>
      ) => void;
      mockFollowUserAction.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve;
        })
      );

      render(<FollowButton {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByRole("button", { name: "Follow" }));

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent(/Following|Unfollow/);
      });

      resolveAction({ success: true, data: undefined });

      await waitFor(() => {
        expect(mockFollowUserAction).toHaveBeenCalled();
      });
    });

    it("does not call unfollowUserAction", async () => {
      render(<FollowButton {...DEFAULT_PROPS} />);

      await userEvent.click(screen.getByRole("button", { name: "Follow" }));

      await waitFor(() => {
        expect(mockFollowUserAction).toHaveBeenCalled();
      });

      expect(mockUnfollowUserAction).not.toHaveBeenCalled();
    });
  });

  describe("given the user clicks Following (to unfollow)", () => {
    it("calls unfollowUserAction with the followingId", async () => {
      render(<FollowButton followingId="user-123" initialIsFollowing={true} />);

      await userEvent.click(screen.getByRole("button", { name: "Following" }));

      await waitFor(() => {
        expect(mockUnfollowUserAction).toHaveBeenCalledWith({
          followingId: "user-123",
        });
      });
    });

    it("optimistically shows Follow before the server responds", async () => {
      let resolveAction!: (
        value: Awaited<ReturnType<typeof unfollowUserAction>>
      ) => void;
      mockUnfollowUserAction.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve;
        })
      );

      render(<FollowButton followingId="user-123" initialIsFollowing={true} />);

      fireEvent.click(screen.getByRole("button", { name: "Following" }));

      await waitFor(() => {
        const button = screen.getByRole("button");
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent("Follow");
      });

      resolveAction({ success: true, data: undefined });

      await waitFor(() => {
        expect(mockUnfollowUserAction).toHaveBeenCalled();
      });
    });

    it("does not call followUserAction", async () => {
      render(<FollowButton followingId="user-123" initialIsFollowing={true} />);

      await userEvent.click(screen.getByRole("button", { name: "Following" }));

      await waitFor(() => {
        expect(mockUnfollowUserAction).toHaveBeenCalled();
      });

      expect(mockFollowUserAction).not.toHaveBeenCalled();
    });
  });

  describe("given the user hovers over the Following button", () => {
    it("shows Unfollow text on hover", async () => {
      render(<FollowButton followingId="user-123" initialIsFollowing={true} />);

      const button = screen.getByRole("button", { name: "Following" });
      await userEvent.hover(button);

      expect(
        screen.getByRole("button", { name: "Unfollow" })
      ).toBeInTheDocument();
    });

    it("reverts to Following text on mouse leave", async () => {
      render(<FollowButton followingId="user-123" initialIsFollowing={true} />);

      const button = screen.getByRole("button", { name: "Following" });
      await userEvent.hover(button);
      await userEvent.unhover(button);

      expect(
        screen.getByRole("button", { name: "Following" })
      ).toBeInTheDocument();
    });
  });

  describe("given the server action fails on follow", () => {
    it("shows an error toast", async () => {
      mockFollowUserAction.mockResolvedValue({
        success: false,
        error: "Network error",
      });

      render(<FollowButton {...DEFAULT_PROPS} />);

      await userEvent.click(screen.getByRole("button", { name: "Follow" }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to follow user", {
          description: "Network error",
        });
      });
    });
  });

  describe("given the server action fails on unfollow", () => {
    it("shows an error toast", async () => {
      mockUnfollowUserAction.mockResolvedValue({
        success: false,
        error: "Network error",
      });

      render(<FollowButton followingId="user-123" initialIsFollowing={true} />);

      await userEvent.click(screen.getByRole("button", { name: "Following" }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to unfollow user", {
          description: "Network error",
        });
      });
    });
  });

  describe("given the action is pending", () => {
    it("disables the button while the action is in flight", async () => {
      mockFollowUserAction.mockReturnValue(new Promise(() => {}));

      render(<FollowButton {...DEFAULT_PROPS} />);

      await userEvent.click(screen.getByRole("button", { name: "Follow" }));

      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});
