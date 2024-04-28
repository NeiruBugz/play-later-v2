"use client";

import { Button } from "@/src/components/ui/button";
import { useToast } from "@/src/components/ui/use-toast";
import { useClipboardCopy } from "@/src/packages/hooks/useClipboardCopy";

export function CopyLink({ userId }: { userId: string }) {
  const { copy } = useClipboardCopy();
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
