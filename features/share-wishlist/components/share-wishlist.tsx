"use client";

import { ShareIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";

import { Button } from "@/shared/components";

export function ShareWishlist({ userName }: { userName?: string | null }) {
  const [, copy] = useCopyToClipboard();
  const router = useRouter();

  const onCopy = async () => {
    if (!userName) {
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
    const encodedUsername = encodeURIComponent(userName);

    const resultURL = `${origin}${sharedUrl}/${encodedUsername}`;

    try {
      await copy(resultURL);
      toast.success("Success", {
        description: "Wishlist link copied to clipboard",
      });
    } catch (e) {
      toast.error("Error", {
        description: e instanceof Error ? e.message : "Failed to copy",
      });
    }
  };

  return (
    <Button onClick={onCopy} className="text-white">
      <ShareIcon className="mr-2 size-4" /> Share wishlist
    </Button>
  );
}
