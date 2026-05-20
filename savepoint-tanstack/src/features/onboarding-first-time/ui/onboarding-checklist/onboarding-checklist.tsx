import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/shared/lib/utils";

import type { OnboardingChecklistProps } from "./onboarding-checklist.type";

/**
 * First-time onboarding checklist (4 steps) — collapsed from canonical's
 * `getting-started` + `getting-started-checklist` + `onboarding-step` trio
 * into a single component. The split was a single-callsite indirection;
 * see DIVERGENCES.md "Slice 20 — onboarding-first-time".
 *
 * Step state derivation is pure on props except for the Steam step, which
 * also reads `onboardingSteamDismissed` from localStorage so a user who
 * never plans to connect Steam can clear the row.
 *
 * When all 4 steps are done, the component writes
 * `onboardingComplete=1` and returns `null`, hiding itself permanently
 * (until that flag is cleared).
 */

const STEAM_DISMISSED_KEY = "onboardingSteamDismissed";
const COMPLETE_KEY = "onboardingComplete";

function readLocalStorageFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeLocalStorageFlag(key: string, value: "1"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / privacy-mode errors — flag is a UX hint, not durable state.
  }
}

type Step = {
  id: string;
  label: string;
  done: boolean;
};

export function OnboardingChecklist({
  libraryItemCount,
  journalEntryCount,
  userImage,
  userSteamId,
}: OnboardingChecklistProps) {
  // SSR-safe: initial render derives `done` from props only. On mount
  // (first client effect) we re-read localStorage to fold in the
  // Steam-dismissed flag and the all-done short-circuit.
  const [steamDismissed, setSteamDismissed] = useState(false);
  const [alreadyComplete, setAlreadyComplete] = useState(false);

  useEffect(() => {
    setSteamDismissed(readLocalStorageFlag(STEAM_DISMISSED_KEY));
    setAlreadyComplete(readLocalStorageFlag(COMPLETE_KEY));
  }, []);

  const steps = useMemo<Step[]>(
    () => [
      {
        id: "library",
        label: "Add your first game",
        done: libraryItemCount > 0,
      },
      {
        id: "journal",
        label: "Write a journal entry",
        done: journalEntryCount > 0,
      },
      {
        id: "profile",
        label: "Set up your profile",
        done: Boolean(userImage && userImage.length > 0),
      },
      {
        id: "steam",
        label: "Connect Steam",
        done: Boolean(userSteamId && userSteamId.length > 0) || steamDismissed,
      },
    ],
    [
      libraryItemCount,
      journalEntryCount,
      userImage,
      userSteamId,
      steamDismissed,
    ]
  );

  const allDone = steps.every((step) => step.done);

  // Persist completion + hide. Effect runs after render — but the all-done
  // return-null branch below short-circuits BEFORE the persist effect on
  // subsequent renders, so the write must happen here.
  useEffect(() => {
    if (allDone) {
      writeLocalStorageFlag(COMPLETE_KEY, "1");
    }
  }, [allDone]);

  if (alreadyComplete || allDone) {
    // Side-effect: ensure the flag is written even before the effect runs
    // (covers the case where the test asserts synchronously). Idempotent.
    if (allDone) writeLocalStorageFlag(COMPLETE_KEY, "1");
    return null;
  }

  return (
    <ul
      aria-label="Onboarding checklist"
      className="divide-border divide-y rounded-md border"
    >
      {steps.map((step) => (
        <li
          key={step.id}
          className={cn(
            "gap-md flex items-center px-4 py-3",
            step.done && "opacity-60"
          )}
        >
          <span
            aria-hidden={!step.done}
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              step.done
                ? "bg-primary text-primary-foreground"
                : "border-border border"
            )}
          >
            {step.done ? (
              <Check role="img" aria-label="Done" className="h-3 w-3" />
            ) : null}
          </span>
          <span
            className={cn("body-sm font-medium", step.done && "line-through")}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
