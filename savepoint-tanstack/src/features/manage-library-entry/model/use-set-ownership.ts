import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";

import { setOwnershipFn } from "../api/set-ownership-fn";

export type UseSetOwnershipArgs = {
  id: number;
  gameTitle: string;
  isOwned: boolean;
};

export type UseSetOwnershipResult = {
  isOwned: boolean;
  setOwned: (next: boolean) => Promise<void>;
  isPending: boolean;
};

/**
 * Optimistic ownership change. Changes for one game are serialized: taps while
 * a change is in flight are ignored. The route is invalidated only after a
 * successful save.
 */
export function useSetOwnership({
  id,
  isOwned,
}: UseSetOwnershipArgs): UseSetOwnershipResult {
  const router = useRouter();
  const [override, setOverride] = useState<boolean | null>(null);
  const [isPending, setIsPending] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    setOverride(null);
  }, [isOwned]);

  const displayed = override ?? isOwned;

  const setOwned = async (next: boolean) => {
    if (inFlight.current || next === displayed) return;
    inFlight.current = true;
    setIsPending(true);
    setOverride(next);
    let saved = false;
    try {
      const result = await setOwnershipFn({ data: { id, isOwned: next } });
      setOverride(result.isOwned);
      saved = true;
    } catch (error) {
      setOverride(null);
      toast.error(getUserFacingErrorMessage(error));
    } finally {
      inFlight.current = false;
      setIsPending(false);
    }
    if (saved) await router.invalidate();
  };

  return { isOwned: displayed, setOwned, isPending };
}
