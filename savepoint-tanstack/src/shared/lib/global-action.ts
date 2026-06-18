import type { useNavigate } from "@tanstack/react-router";

/**
 * The global-overlay protocol lives in the root search schema
 * (`rootSearchSchema` in `routes/__root.tsx`): `?action=<name>&game=<slug>`.
 * `GlobalActionHost` reads those params and renders the matching overlay.
 *
 * These helpers are the single source of truth for *writing* that protocol so
 * the bottom nav, game-detail CTA, and the host itself can't drift. Removal is
 * expressed by setting a param to `undefined` — TanStack Router drops
 * `undefined` search values from the URL, so no manual key-stripping (and no
 * `Record<string, unknown>` cast) is needed.
 */
export type GlobalActionName = "log-session" | "add-game";

type NavigateFn = ReturnType<typeof useNavigate>;

export function openGlobalAction(
  navigate: NavigateFn,
  action: GlobalActionName,
  game?: string
): void {
  void navigate({
    to: ".",
    search: (prev) => ({ ...prev, action, game }),
  });
}

export function setGlobalActionGame(navigate: NavigateFn, game: string): void {
  void navigate({
    to: ".",
    search: (prev) => ({ ...prev, game }),
  });
}

export function closeGlobalAction(navigate: NavigateFn): void {
  void navigate({
    to: ".",
    search: (prev) => ({ ...prev, action: undefined, game: undefined }),
  });
}
