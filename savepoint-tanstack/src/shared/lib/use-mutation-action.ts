import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/shared/lib/errors";

type RunOptions<T> = {
  /**
   * Toast shown on success. Omit to skip the success toast (e.g. flows that
   * surface success through navigation or a separate undo toast).
   */
  successMessage?: string;
  /**
   * Fallback passed to `getErrorMessage` when the thrown value is not an
   * `Error`. The error toast always uses the mapped message.
   */
  errorFallback: string;
  /**
   * Whether to call `router.invalidate()` after success. Defaults to `true`
   * since loader re-runs are the dominant case.
   */
  invalidate?: boolean;
  /**
   * Side effect fired ONLY on the success path, after the toast + invalidate.
   * Receives the fn's resolved value. Prefer this over branching on the
   * runner's return value, which cannot distinguish a `void` success from a
   * failure.
   */
  onSuccess?: (result: T) => void;
};

/**
 * Wraps the hand-rolled mutation envelope shared across feature/widget action
 * components: a `pending` flag, an async runner that calls the provided async
 * fn, shows an optional success toast, invalidates the router, and on failure
 * toasts `getErrorMessage(err, fallback)`.
 *
 * The runner resolves to the fn's result on success and `undefined` on error,
 * so callers can fire post-success side effects (close a dialog, call a parent
 * callback) only when a result is present.
 */
export function useMutationAction() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = async <T>(
    fn: () => Promise<T>,
    options: RunOptions<T>
  ): Promise<T | undefined> => {
    setPending(true);
    try {
      const result = await fn();
      if (options.successMessage !== undefined) {
        toast.success(options.successMessage);
      }
      if (options.invalidate !== false) {
        await router.invalidate();
      }
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      toast.error(getErrorMessage(err, options.errorFallback));
      return undefined;
    } finally {
      setPending(false);
    }
  };

  return { pending, run };
}
