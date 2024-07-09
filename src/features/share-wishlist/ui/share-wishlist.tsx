"use client"

import { Button } from "@/src/shared/ui";
import { ShareIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { useCopyToClipboard } from "usehooks-ts";

export function ShareWishlist() {
  const [value, copy] = useCopyToClipboard();
  const session = useSession();
  const pathname = usePathname();

  const onCopy = useCallback(() => {
    if (!session?.data?.user) {
      return;
    }

    const sharedUrl = '/shared-wishlist';
    const origin = window.location.origin;

    console.log(session.data.user.id)
    console.log(pathname)
    const resultURL = `${origin}${sharedUrl}/${session.data.user.id}`;
    console.log(resultURL)
  }, [pathname, session?.data?.user])

  return (
    <Button variant="outline" onClick={onCopy}>
      <ShareIcon className="mr-2 size-4"/> Share wishlist
    </Button>
  );
}