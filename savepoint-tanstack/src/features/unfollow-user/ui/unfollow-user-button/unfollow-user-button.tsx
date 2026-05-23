import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

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
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (viewerUserId === null) return null;
  if (viewerUserId === profileUserId) return null;
  if (!isFollowing) return null;

  const handleClick = async () => {
    setPending(true);
    try {
      await unfollowUserFn({ data: { targetUserId: profileUserId } });
      toast.success(`Unfollowed @${profileUsername}`);
      router.invalidate();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update follow status";
      toast.error(message);
    } finally {
      setPending(false);
    }
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
