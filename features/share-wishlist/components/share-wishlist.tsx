"use client";

import { Button } from "@/shared/components";
import { useToast } from "@/shared/components/use-toast";
import { ShareIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback } from "react";
import { useCopyToClipboard } from "usehooks-ts";

export function ShareWishlist() {
  const [, copy] = useCopyToClipboard();
  const session = useSession();
  const { toast } = useToast();

  const onCopy = useCallback(() => {
    if (!session?.data?.user) {
      return;
    }

    const sharedUrl = "/wishlist";
    const origin = window.location.origin;

    const resultURL = `${origin}${sharedUrl}/${session.data.user.id}`;
    copy(resultURL)
      .then(() =>
        toast({
          title: "Success",
          description: "Wishlist link copied to clipboard",
        })
      )
      .catch((e) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: e.message,
        });
      });
  }, [copy, session?.data?.user, toast]);

  return (
    <Button onClick={onCopy} className="text-white">
      <ShareIcon className="mr-2 size-4" /> Share wishlist
    </Button>
  );
}
