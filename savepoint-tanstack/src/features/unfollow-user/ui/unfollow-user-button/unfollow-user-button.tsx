import { useMutationAction } from "@/shared/lib/use-mutation-action";
import { Button } from "@/shared/ui/button";

import { unfollowUserFn } from "../../api/unfollow-user-fn";

export type UnfollowUserButtonProps = {
  profileUserId: string;
  profileUsername: string;
  viewerUserId: string | null;
  isFollowing: boolean;
};

export function UnfollowUserButton({
  profileUserId,
  profileUsername,
  viewerUserId,
  isFollowing,
}: UnfollowUserButtonProps) {
  const { pending, run } = useMutationAction();

  if (viewerUserId === null) return null;
  if (viewerUserId === profileUserId) return null;
  if (!isFollowing) return null;

  const handleClick = async () => {
    await run(() => unfollowUserFn({ data: { targetUserId: profileUserId } }), {
      successMessage: `Unfollowed @${profileUsername}`,
      errorFallback: "Could not update follow status",
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={pending}
      aria-label={`Unfollow @${profileUsername}`}
    >
      Unfollow
    </Button>
  );
}
