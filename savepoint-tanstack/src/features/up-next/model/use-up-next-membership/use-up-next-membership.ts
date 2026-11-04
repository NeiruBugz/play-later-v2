import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";

import { addToUpNextFn } from "../../api/add-to-up-next-fn";
import { removeFromUpNextFn } from "../../api/remove-from-up-next-fn";
import type {
  UseUpNextMembershipArgs,
  UseUpNextMembershipResult,
} from "./use-up-next-membership.type";

/**
 * Put a game in / remove it from Up Next. Removal shows at once and reverts on
 * failure; putting in waits for the server because the place number is the
 * server's answer. Changes for one game are serialized, and the route is only
 * invalidated after a change that saved.
 */
export function useUpNextMembership({
  id,
  gameTitle,
  upNextPosition,
}: UseUpNextMembershipArgs): UseUpNextMembershipResult {
  const router = useRouter();
  const [override, setOverride] = useState<{ position: number | null } | null>(
    null
  );
  const [isPending, setIsPending] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    setOverride(null);
  }, [upNextPosition]);

  const position = override === null ? upNextPosition : override.position;

  const runSerialized = async (task: () => Promise<boolean>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsPending(true);
    let saved = false;
    try {
      saved = await task();
    } finally {
      inFlight.current = false;
      setIsPending(false);
    }
    if (saved) await router.invalidate();
  };

  const put = () =>
    runSerialized(async () => {
      try {
        const result = await addToUpNextFn({ data: { id } });
        setOverride({ position: result.position });
        toast(`${gameTitle} is in Up Next`);
        return true;
      } catch (error) {
        toast.error(getUserFacingErrorMessage(error));
        return false;
      }
    });

  const remove = () =>
    runSerialized(async () => {
      setOverride({ position: null });
      try {
        await removeFromUpNextFn({ data: { id } });
        toast(`${gameTitle} left Up Next`);
        return true;
      } catch (error) {
        setOverride(null);
        toast.error(getUserFacingErrorMessage(error));
        return false;
      }
    });

  return {
    upNextPosition: position,
    isQueued: position !== null,
    put,
    remove,
    isPending,
  };
}
