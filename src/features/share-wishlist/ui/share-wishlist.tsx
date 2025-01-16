"use client";

import { Button } from "@/src/shared/ui";
import { useToast } from "@/src/shared/ui/use-toast";
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
    <Button
      onClick={onCopy}
      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:bg-green-700"
    >
      <ShareIcon className="mr-2 size-4" /> Share wishlist
    </Button>
  );
}
