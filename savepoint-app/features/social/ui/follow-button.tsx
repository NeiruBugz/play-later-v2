"use client";

import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";

import { useFollow } from "../hooks/use-follow";

type FollowButtonProps = {
  followingId: string;
  initialIsFollowing: boolean;
};

export function FollowButton({
  followingId,
  initialIsFollowing,
}: FollowButtonProps) {
  const { isFollowing, isPending, toggleFollow } = useFollow({
    followingId,
    initialIsFollowing,
  });
  const [isHovered, setIsHovered] = useState(false);

  const showUnfollow = isFollowing && isHovered;

  const variant = isFollowing
    ? showUnfollow
      ? "destructive"
      : "secondary"
    : "outline";

  const label = isFollowing
    ? showUnfollow
      ? "Unfollow"
      : "Following"
    : "Follow";

  return (
    <Button
      variant={variant}
      size="sm"
      disabled={isPending}
      onClick={toggleFollow}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("min-w-[6rem]", isPending && "opacity-70")}
    >
      {label}
    </Button>
  );
}
