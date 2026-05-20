import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getSteamConnectionFn } from "@/features/steam-connect";
import { fetchSteamGamesFn } from "@/features/steam-import/api/fetch-steam-games";
import {
  GenericErrorBanner,
  SteamApiUnavailableErrorCard,
  SteamPrivacyErrorCard,
  SteamProfileNotFoundErrorCard,
  SteamRateLimitErrorCard,
} from "@/features/steam-import/ui/error-cards";
import { ImportedGamesPage } from "@/widgets/imported-games-page";

/**
 * `/steam/games` — protected route for the Steam imported-games surface.
 *
 * Loader fetches the imported-games list (parallel with the Steam connection
 * read so we can branch the empty state on whether the user has linked an
 * account yet). The error component branches on the typed Steam errors
 * thrown from `fetchOwnedGames` (Phase A taxonomy).
 *
 * Search params (URL-driven filter/sort/search state — Phase D follow-up):
 *   - `include=ignored`        — surface dismissed rows
 *   - `q=<string>`             — case-insensitive name search
 *   - `playtimeStatus`         — all | played | never_played
 *   - `playtimeRange`          — all | under_1h | 1_to_10h | 10_to_50h | over_50h
 *   - `platform`               — all | windows | mac | linux
 *   - `lastPlayed`             — all | 30_days | 1_year | over_1_year | never
 *   - `sortBy`                 — added_desc (default) | name_asc | name_desc |
 *                                playtime_desc | playtime_asc |
 *                                last_played_desc | last_played_asc
 *
 * URL-driven state (rather than local `useState`) is the tanstack tradition:
 * deep-links + browser back/forward work for free. Canonical uses `useState`
 * because it's a Next.js client component; we use TanStack's `validateSearch`
 * + `loaderDeps`. See Slice 14A library-filters for the closest precedent.
 */
const PLAYTIME_STATUS = z.enum(["all", "played", "never_played"]).optional();
const PLAYTIME_RANGE = z
  .enum(["all", "under_1h", "1_to_10h", "10_to_50h", "over_50h"])
  .optional();
const PLATFORM = z.enum(["all", "windows", "mac", "linux"]).optional();
const LAST_PLAYED = z
  .enum(["all", "30_days", "1_year", "over_1_year", "never"])
  .optional();
const SORT_BY = z
  .enum([
    "added_desc",
    "name_asc",
    "name_desc",
    "playtime_desc",
    "playtime_asc",
    "last_played_desc",
    "last_played_asc",
  ])
  .optional();

const searchSchema = z.object({
  include: z.enum(["ignored"]).optional(),
  q: z.string().optional(),
  playtimeStatus: PLAYTIME_STATUS,
  playtimeRange: PLAYTIME_RANGE,
  platform: PLATFORM,
  lastPlayed: LAST_PLAYED,
  sortBy: SORT_BY,
});

export const Route = createFileRoute("/_authed/steam/games")({
  validateSearch: (input) => searchSchema.parse(input),
  loaderDeps: ({ search }) => ({
    includeIgnored: search.include === "ignored",
    q: search.q,
    playtimeStatus: search.playtimeStatus,
    playtimeRange: search.playtimeRange,
    platform: search.platform,
    lastPlayed: search.lastPlayed,
    sortBy: search.sortBy,
  }),
  loader: async ({ deps }) => {
    const [connection, games] = await Promise.all([
      getSteamConnectionFn(),
      fetchSteamGamesFn({
        data: {
          includeIgnored: deps.includeIgnored,
          search: deps.q,
          playtimeStatus: deps.playtimeStatus,
          playtimeRange: deps.playtimeRange,
          platform: deps.platform,
          lastPlayed: deps.lastPlayed,
          sortBy: deps.sortBy,
        },
      }),
    ]);
    return {
      steamId: connection.steamId,
      games,
      includeIgnored: deps.includeIgnored,
      filters: {
        q: deps.q,
        playtimeStatus: deps.playtimeStatus,
        playtimeRange: deps.playtimeRange,
        platform: deps.platform,
        lastPlayed: deps.lastPlayed,
        sortBy: deps.sortBy,
      },
    };
  },
  component: SteamGamesRoute,
  errorComponent: SteamGamesError,
});

function SteamGamesRoute() {
  const { steamId, games, includeIgnored, filters } = Route.useLoaderData();

  return (
    <main className="container mx-auto px-4 py-6">
      <h2 className="mb-6 text-2xl font-semibold">Imported games</h2>
      <ImportedGamesPage
        games={games}
        steamId={steamId}
        includeIgnored={includeIgnored}
        filters={filters}
      />
    </main>
  );
}

/**
 * Route-level error component. Branches on the Steam-error subclass names
 * (Phase A taxonomy — all extend `UpstreamError` with distinct `name`s).
 * The `name` check is structural: `instanceof` cannot reliably cross the
 * server-fn RPC boundary (the thrown error is reconstructed on the client),
 * but the `name` property survives serialization.
 */
function SteamGamesError({ error }: { error: unknown }) {
  const errName = error instanceof Error ? error.name : "";
  const message =
    error instanceof Error ? error.message : "Could not load Steam games";

  return (
    <main className="container mx-auto px-4 py-6">
      <h2 className="mb-6 text-2xl font-semibold">Imported games</h2>
      {errName === "SteamProfilePrivateError" ? (
        <SteamPrivacyErrorCard message={message} />
      ) : errName === "SteamApiUnavailableError" ? (
        <SteamApiUnavailableErrorCard message={message} />
      ) : errName === "SteamProfileNotFoundError" ? (
        <SteamProfileNotFoundErrorCard message={message} />
      ) : errName === "SteamRateLimitError" ? (
        <SteamRateLimitErrorCard message={message} />
      ) : (
        <GenericErrorBanner message={message} />
      )}
    </main>
  );
}
