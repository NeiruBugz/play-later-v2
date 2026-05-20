import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { connectSteamFn } from "@/features/steam-connect";
import { AppError } from "@/shared/lib/errors";

/**
 * `/steam/callback` — Steam OpenID return-to landing.
 *
 * Public route (NOT under `_authed/`): Steam redirects unauthenticated
 * browsers here too if the session was lost mid-flow. The handler delegates
 * to `connectSteamFn`, which calls `requireUserId()` internally and throws
 * `UnauthorizedError` if there is no session — surfaced as a friendly
 * inline message via `errorComponent`.
 *
 * Success path: redirect to `/settings/account`. No success toast — the
 * visual flip of the SteamConnectCard is the perceptible feedback. See
 * DIVERGENCES.md (Slice 21 Phase B).
 *
 * Failure path: render `errorComponent`, branching on `AppError.code`:
 *   - UNAUTHORIZED → "Sign in required" + link to /login
 *   - VALIDATION   → "Steam authentication failed — please try again."
 *   - UPSTREAM     → "Steam is unavailable right now."
 *   - default      → generic copy
 */

// Steam returns ~10 `openid.*` keys; TanStack Router's default search parser
// silently coerces purely-numeric values (e.g. `openid.assoc_handle=12345`)
// into JS numbers, so accept primitives and stringify before passing to the
// OpenID verifier (which builds a urlencoded body and needs strings).
const searchSchema = z
  .record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]).transform((v) => String(v))
  )
  .optional();

export const Route = createFileRoute("/steam/callback")({
  validateSearch: (input) => searchSchema.parse(input) ?? {},
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const params: Record<string, string> = deps.search ?? {};
    await connectSteamFn({ data: { params } });
    throw redirect({ to: "/settings/account" });
  },
  component: SteamCallbackPage,
  errorComponent: SteamCallbackError,
});

function SteamCallbackPage() {
  // The loader always either redirects or throws — this is a defensive
  // fallback that should not render in normal flow.
  return (
    <main className="container mx-auto px-4 py-6">
      <p>Connecting your Steam account…</p>
    </main>
  );
}

function SteamCallbackError({ error }: { error: unknown }) {
  const message = resolveErrorMessage(error);

  return (
    <main className="container mx-auto px-4 py-6">
      <h2 className="mb-2 text-2xl font-semibold">
        Could not connect Steam account
      </h2>
      <p className="text-muted-foreground mb-6">{message}</p>
      <a
        href="/settings/account"
        className="text-primary underline-offset-4 hover:underline"
      >
        Back to account settings
      </a>
    </main>
  );
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return "Sign in required to link a Steam account.";
      case "VALIDATION":
        return "Steam authentication failed. Please try connecting again.";
      case "UPSTREAM":
        return "Steam is unavailable right now. Please try again shortly.";
      default:
        return "Something went wrong while connecting your Steam account.";
    }
  }
  return "Something went wrong while connecting your Steam account.";
}
