import { cookies } from "next/headers";

import { cn } from "@/shared/lib/ui/utils";

import { MigrationNoticeCookieClearer } from "./migration-notice-client";

const MIGRATED_COOKIE = "auth_migrated";

export async function MigrationNotice() {
  const store = await cookies();
  const cookie = store.get(MIGRATED_COOKIE);
  if (!cookie) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "border-warning/30 bg-warning/10 text-warning",
        "px-lg py-md mb-xl rounded-md border text-sm leading-relaxed"
      )}
    >
      <p className="font-medium">We&rsquo;ve upgraded our sign-in system.</p>
      <p className="text-warning/90 mt-1">
        Please sign in again to continue. Your library, journal, and settings
        are unaffected.
      </p>
      <MigrationNoticeCookieClearer />
    </div>
  );
}
