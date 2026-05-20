import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

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
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (viewerUserId === null) return null;
  if (viewerUserId === profileUserId) return null;
  if (isFollowing) return null;

  const handleClick = async () => {
    setPending(true);
    try {
      await followUserFn({ data: { targetUserId: profileUserId } });
      toast.success(`Following @${profileUsername}`);
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
      onClick={handleClick}
      disabled={pending}
      aria-label={`Follow @${profileUsername}`}
    >
      Follow
    </Button>
  );
}
