import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { invalidateCurrentUser } from "@/entities/session/api/invalidate-current-user";
import { acknowledgeNoticeFn } from "@/features/whats-new/api/acknowledge-notice-fn";
import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { Button } from "@/shared/ui/button";
import { ResponsiveModal } from "@/shared/ui/responsive-modal";

const STATUS_EXPLANATIONS = [
  { term: "Want", meaning: "games you want to play" },
  { term: "Playing", meaning: "what you are playing now" },
  { term: "Done", meaning: "games you finished or let go" },
  {
    term: "Up Next",
    meaning: "up to 5 games you will play next, in order",
  },
] as const;

export function StatusModelNotice() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const acknowledge = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await acknowledgeNoticeFn();
      setOpen(false);
      await invalidateCurrentUser(queryClient);
      await router.invalidate();
    } catch (err: unknown) {
      setError(getUserFacingErrorMessage(err));
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(next) => {
        if (!next) void acknowledge();
      }}
      title="Your library has three statuses now"
      description="Every game is Want, Playing or Done. Up Next is a short list of what to play next."
      contentClassName="sm:max-w-md"
    >
      <dl className="space-y-sm text-sm">
        {STATUS_EXPLANATIONS.map(({ term, meaning }) => (
          <div key={term} className="gap-sm flex">
            <dt className="w-20 shrink-0 font-semibold">{term}</dt>
            <dd className="text-muted-foreground">{meaning}</dd>
          </div>
        ))}
      </dl>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button onClick={() => void acknowledge()} disabled={isSaving}>
        Got it
      </Button>
    </ResponsiveModal>
  );
}
