import { z } from "zod";

import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

import { igdbContextFromThrown } from "./errors";
import { igdbFetch } from "./fetch";

const logger = createLogger({ service: "igdb-get-game-details-by-slug" });

const DETAILS_FIELDS = [
  "name",
  "slug",
  "summary",
  "aggregated_rating",
  "first_release_date",
  "cover.image_id",
  "genres.id",
  "genres.name",
  "platforms.id",
  "platforms.name",
  "platforms.slug",
  "platforms.abbreviation",
  "screenshots.id",
  "screenshots.image_id",
  "themes.id",
  "themes.name",
  "involved_companies.developer",
  "involved_companies.publisher",
  "involved_companies.company.id",
  "involved_companies.company.name",
  "franchise",
] as const;

function escapeSlug(slug: string): string {
  return slug.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const GenreSchema = z.object({ id: z.number(), name: z.string() });
const PlatformSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().optional(),
  abbreviation: z.string().optional(),
});
const ScreenshotSchema = z.object({ id: z.number(), image_id: z.string() });
const ThemeSchema = z.object({ id: z.number(), name: z.string() });
const InvolvedCompanySchema = z.object({
  developer: z.boolean(),
  publisher: z.boolean(),
  company: z.object({ id: z.number(), name: z.string() }),
});

export const GameDetailsResponseItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  summary: z.string().optional(),
  aggregated_rating: z.number().optional(),
  first_release_date: z.number().optional(),
  cover: z.object({ image_id: z.string() }).optional(),
  genres: z.array(GenreSchema).optional(),
  platforms: z.array(PlatformSchema).optional(),
  screenshots: z.array(ScreenshotSchema).optional(),
  themes: z.array(ThemeSchema).optional(),
  involved_companies: z.array(InvolvedCompanySchema).optional(),
  franchise: z.number().optional(),
});

export type GameDetailsResponseItem = z.infer<
  typeof GameDetailsResponseItemSchema
>;

export async function getGameDetailsFromIgdb(
  slug: string
): Promise<GameDetailsResponseItem | null> {
  const query = `fields ${DETAILS_FIELDS.join(",")}; where slug = "${escapeSlug(slug)}"; limit 1;`;

  let response: unknown;
  try {
    response = await igdbFetch("/games", query);
  } catch (cause) {
    const igdbContext = igdbContextFromThrown(cause);
    logger.error(
      { err: cause, slug, ...igdbContext },
      "IGDB get-game-details-by-slug transport failure"
    );
    throw new UpstreamError("IGDB get-game-details-by-slug failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      slug,
      query,
      ...igdbContext,
    });
  }

  const parsed = z.array(GameDetailsResponseItemSchema).safeParse(response);
  if (!parsed.success) {
    logger.error(
      { issues: parsed.error.issues, slug },
      "IGDB get-game-details-by-slug returned malformed response"
    );
    throw new UpstreamError(
      "IGDB get-game-details-by-slug returned malformed response",
      { slug }
    );
  }

  return parsed.data[0] ?? null;
}
