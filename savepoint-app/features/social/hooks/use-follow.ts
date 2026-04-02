import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { followUserAction } from "../server-actions/follow-user";
import { unfollowUserAction } from "../server-actions/unfollow-user";

type UseFollowProps = {
  followingId: string;
  initialIsFollowing: boolean;
};

export function useFollow({ followingId, initialIsFollowing }: UseFollowProps) {
  const [isPending, startTransition] = useTransition();
  const [isFollowing, setOptimisticIsFollowing] =
    useOptimistic(initialIsFollowing);

  function toggleFollow() {
    startTransition(async () => {
      const nextState = !isFollowing;
      setOptimisticIsFollowing(nextState);

      const action = nextState ? followUserAction : unfollowUserAction;
      const result = await action({ followingId });

      if (!result.success) {
        toast.error(
          nextState ? "Failed to follow user" : "Failed to unfollow user",
          { description: result.error }
        );
      }
    });
  }

  return { isFollowing, isPending, toggleFollow };
}
