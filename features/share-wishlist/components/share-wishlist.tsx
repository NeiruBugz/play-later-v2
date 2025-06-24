"use client";

import { getUserInfo } from "@/features/manage-user-info/server-actions/get-user-info";
import { Button } from "@/shared/components";
import { useMutation } from "@tanstack/react-query";
import { ShareIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";

export function ShareWishlist() {
  const [, copy] = useCopyToClipboard();
  const session = useSession();
  const router = useRouter();
  const { mutateAsync: fetchUserInfo } = useMutation({
    mutationKey: ["get-user-info"],
    mutationFn: async (userId: string) => await getUserInfo(userId),
  });

  const onCopy = useCallback(async () => {
    if (!session?.data?.user?.id) {
      return;
    }

    const userInfo = await fetchUserInfo(session.data.user.id);

    if (!userInfo) {
      return;
    }

    if (!userInfo.username) {
      toast.info("Username not set", {
        description: "Please set a username to share your wishlist",
        position: "top-right",
        action: {
          label: "Set username",
          onClick: () => {
            router.push("/user/settings");
          },
        },
      });
      return;
    }

    const sharedUrl = "/wishlist";
    const origin = window.location.origin;

    const resultURL = `${origin}${sharedUrl}/${encodeURIComponent(userInfo.username)}`;
    copy(resultURL)
      .then(() =>
        toast.success("Success", {
          description: "Wishlist link copied to clipboard",
        })
      )
      .catch((e) => {
        toast.error("Error", {
          description: e.message,
        });
      });
  }, [copy, session?.data?.user, fetchUserInfo, router]);

  return (
    <Button onClick={onCopy} className="text-white">
      <ShareIcon className="mr-2 size-4" /> Share wishlist
    </Button>
  );
}
