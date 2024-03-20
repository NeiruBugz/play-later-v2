"use client";

import { Button } from "@/components/ui/button";

import { useClipboardCopy } from "@/lib/hooks/useClipboardCopy";

export function CopyLink({ userId }: { userId: string }) {
  const { copy } = useClipboardCopy();

  const onLinkCopy = async () => {
    const url = `${window.location.origin}/shared-wishlist/${userId}`;
    await copy(url);
  };

  return (
    <Button variant="outline" onClick={onLinkCopy}>
      Copy link
    </Button>
  );
}
