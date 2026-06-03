import { useMutationAction } from "@/shared/lib/use-mutation-action";
import { Button } from "@/shared/ui/button";

import { followUserFn } from "../../api/follow-user-fn";

export type FollowUserButtonProps = {
  profileUserId: string;
  profileUsername: string;
  viewerUserId: string | null;
  isFollowing: boolean;
};

export function FollowUserButton({
  profileUserId,
  profileUsername,
  viewerUserId,
  isFollowing,
}: FollowUserButtonProps) {
  const { pending, run } = useMutationAction();

  if (viewerUserId === null) return null;
  if (viewerUserId === profileUserId) return null;
  if (isFollowing) return null;

  const handleClick = async () => {
    await run(() => followUserFn({ data: { targetUserId: profileUserId } }), {
      successMessage: `Following @${profileUsername}`,
      errorFallback: "Could not update follow status",
    });
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={`Follow @${profileUsername}`}
    >
      Follow
    </Button>
  );
}
