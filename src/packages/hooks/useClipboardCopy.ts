import { useState } from "react";

type CopiedValue = null | string;
type CopyFn = (text: string) => Promise<boolean>; // Return success
type useCopyToClipboardReturnValue = {
  copiedText: CopiedValue;
  copy: CopyFn;
};

export function useClipboardCopy(): useCopyToClipboardReturnValue {
  const [copiedText, setCopiedText] = useState<CopiedValue>(null);

  const copy: CopyFn = async (text) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported");
      return false;
    }

    // Try to save to clipboard then save it in the state if worked
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      console.warn("Copy failed", error);
      setCopiedText(null);
      return false;
    }
  };

  return { copiedText, copy };
}
