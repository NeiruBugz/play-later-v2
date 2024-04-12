"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

import { useClipboardCopy } from "@/lib/hooks/useClipboardCopy";

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
    <Button variant="outline" onClick={onLinkCopy}>
      Copy link
    </Button>
  );
}
