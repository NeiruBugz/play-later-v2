import { IgdbHttpError } from "@/shared/api/igdb/errors";
import { igdbFetch } from "@/shared/api/igdb/fetch";

const PAUSE_BETWEEN_REQUESTS_MS = 300;
const SAMPLES_PER_DATE_FORMAT = 3;
const GAME_IDS_PER_REQUEST = 20;

const RELEASE_DATE_FIELDS = [
  "date",
  "date_format",
  "y",
  "m",
  "human",
  "status",
];
const RELEASE_DATE_FIELDS_ON_RELEASE_DATES = RELEASE_DATE_FIELDS.join(", ");
const RELEASE_DATE_FIELDS_ON_GAMES = RELEASE_DATE_FIELDS.map(
  (field) => `release_dates.${field}`
).join(", ");

interface DateFormat {
  id: number;
  format?: string;
}

interface SampledReleaseDate {
  game?: number;
}

interface GameReleaseInfo {
  id: number;
  name?: string;
  first_release_date?: number;
  release_dates?: unknown[];
}

function describeIgdbFailure(error: IgdbHttpError) {
  const { resource, query, status, igdbTitle, igdbCause, bodySnippet } =
    error.context;
  return { resource, query, status, igdbTitle, igdbCause, bodySnippet };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const nowInSeconds = () => Math.floor(Date.now() / 1000);

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

async function queryIgdb<T>(resource: string, query: string): Promise<T[]> {
  await sleep(PAUSE_BETWEEN_REQUESTS_MS);
  const response = await igdbFetch(resource, query);
  if (!Array.isArray(response)) {
    throw new Error(`IGDB ${resource} did not return a list`);
  }
  return response as T[];
}

async function sampleGameIdsForDateFormat(
  dateFormatId: number
): Promise<number[]> {
  const searches = [
    {
      where: `date_format = ${dateFormatId} & date > ${nowInSeconds()}`,
      sort: "sort date asc;",
    },
    { where: `date_format = ${dateFormatId}`, sort: "" },
  ];

  for (const { where, sort } of searches) {
    const samples = await queryIgdb<SampledReleaseDate>(
      "/release_dates",
      `fields game, ${RELEASE_DATE_FIELDS_ON_RELEASE_DATES}; where ${where}; ${sort} limit ${SAMPLES_PER_DATE_FORMAT};`
    );
    const gameIds = samples.flatMap(({ game }) => (game ? [game] : []));
    if (gameIds.length > 0) {
      return gameIds;
    }
  }
  return [];
}

async function fetchGamesReleaseInfo(
  gameIds: number[]
): Promise<Map<number, GameReleaseInfo>> {
  const gamesById = new Map<number, GameReleaseInfo>();
  for (const idsChunk of chunk(gameIds, GAME_IDS_PER_REQUEST)) {
    const games = await queryIgdb<GameReleaseInfo>(
      "/games",
      `fields name, first_release_date, ${RELEASE_DATE_FIELDS_ON_GAMES}; where id = (${idsChunk.join(",")}); limit ${GAME_IDS_PER_REQUEST};`
    );
    for (const game of games) {
      gamesById.set(game.id, game);
    }
  }
  return gamesById;
}

async function inspectReleaseDates() {
  const dateFormats = await queryIgdb<DateFormat>(
    "/date_formats",
    "fields *; limit 50;"
  );

  const gameIdsByDateFormat = new Map<number, number[]>();
  const samplingFailureByDateFormat = new Map<
    number,
    ReturnType<typeof describeIgdbFailure> | { message: string }
  >();
  for (const { id } of dateFormats) {
    try {
      gameIdsByDateFormat.set(id, await sampleGameIdsForDateFormat(id));
    } catch (error) {
      samplingFailureByDateFormat.set(
        id,
        error instanceof IgdbHttpError
          ? describeIgdbFailure(error)
          : { message: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  const gamesById = await fetchGamesReleaseInfo([
    ...new Set([...gameIdsByDateFormat.values()].flat()),
  ]);

  const samples = dateFormats.map(({ id, format }) => ({
    dateFormatId: id,
    formatName: format ?? null,
    error: samplingFailureByDateFormat.get(id) ?? null,
    games: (gameIdsByDateFormat.get(id) ?? []).flatMap((gameId) => {
      const game = gamesById.get(gameId);
      return game ? [game] : [];
    }),
  }));

  const notes = [
    "Working hypothesis to confirm: 0 = DAY, 1 = MONTH, 2 = YEAR, 3-6 = QUARTER Q1-Q4, 7 = TBD.",
    "Per game, compare first_release_date with release_dates[].date and y/m/human: a precision other than DAY with a first_release_date that is not the first day of its period means IGDB stores a placeholder day.",
    ...samples
      .filter(({ games, error }) => games.length === 0 && error === null)
      .map(
        ({ dateFormatId }) =>
          `date_format ${dateFormatId}: no release_dates entries with a game were found`
      ),
  ];

  return {
    generatedAt: new Date().toISOString(),
    dateFormats,
    samples,
    notes,
  };
}

try {
  const report = await inspectReleaseDates();
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(
    error instanceof IgdbHttpError
      ? JSON.stringify(describeIgdbFailure(error), null, 2)
      : error instanceof Error
        ? error.message
        : error
  );
  process.exitCode = 1;
}
