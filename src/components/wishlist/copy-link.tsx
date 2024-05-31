"use client";

import { useCopyToClipboard } from "usehooks-ts";
import { Button } from "@/src/shared/ui/button";
import { useToast } from "@/src/shared/ui/use-toast";

export function CopyLink({ userId }: { userId: string }) {
  const [, copy] = useCopyToClipboard();
  const { toast } = useToast();

  const onLinkCopy = async () => {
    try {
      const url = `${window.location.origin}/shared-wishlist/${userId}`;
      await copy(url);
      toast({ title: "Link copied" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <Button onClick={onLinkCopy} variant="outline">
      Copy link
    </Button>
  );
}
