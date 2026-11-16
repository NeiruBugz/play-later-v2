import { IgdbHttpError } from "@/shared/api/igdb/errors";
import { igdbFetch } from "@/shared/api/igdb/fetch";

const PAUSE_BETWEEN_REQUESTS_MS = 300;
const SAMPLE_STEAM_APP_IDS = ["220", "440", "570", "730", "292030"];
const STEAM_SOURCE_NAME = "Steam";

const EXPANDED_GAME_FIELDS = [
  "game.id",
  "game.name",
  "game.slug",
  "game.game_type",
  "game.first_release_date",
  "game.cover.image_id",
  "game.release_dates.date",
  "game.release_dates.date_format",
  "game.release_dates.y",
  "game.release_dates.m",
].join(", ");

const BRACE_SHORTHAND_GAME_FIELDS =
  "game.id, game.release_dates.{date,date_format,y,m}";

interface ExternalGameSource {
  id: number;
  name?: string;
}

interface ExternalGame {
  uid: string;
  external_game_source: number;
  game?: { id: number; game_type?: number };
}

function describeIgdbFailure(error: IgdbHttpError) {
  const { resource, query, status, igdbTitle, igdbCause, bodySnippet } =
    error.context;
  return { resource, query, status, igdbTitle, igdbCause, bodySnippet };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function queryIgdb<T>(resource: string, query: string): Promise<T[]> {
  await sleep(PAUSE_BETWEEN_REQUESTS_MS);
  const response = await igdbFetch(resource, query);
  if (!Array.isArray(response)) {
    throw new Error(`IGDB ${resource} did not return a list`);
  }
  return response as T[];
}

function summariseSampleByUid(rows: ExternalGame[]) {
  return SAMPLE_STEAM_APP_IDS.map((uid) => {
    const rowsForUid = rows.filter((row) => row.uid === uid);
    return {
      uid,
      rowCount: rowsForUid.length,
      gameIds: rowsForUid.map((row) => row.game?.id ?? null),
      gameTypes: rowsForUid.map((row) => row.game?.game_type ?? null),
    };
  });
}

async function describeAttempt(run: () => Promise<ExternalGame[]>) {
  try {
    const rows = await run();
    return { ok: true, rowCount: rows.length, rows };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof IgdbHttpError
          ? describeIgdbFailure(error)
          : { message: error instanceof Error ? error.message : String(error) },
    };
  }
}

async function inspectExternalGameSources() {
  const sources = await queryIgdb<ExternalGameSource>(
    "/external_game_sources",
    "fields id, name; limit 50;"
  );
  const steamSource = sources.find(({ name }) => name === STEAM_SOURCE_NAME);
  if (!steamSource) {
    throw new Error(
      `No external_game_source named "${STEAM_SOURCE_NAME}" was returned`
    );
  }

  const uidList = SAMPLE_STEAM_APP_IDS.map((uid) => `"${uid}"`).join(",");
  const where = `where external_game_source = ${steamSource.id} & uid = (${uidList}); limit 500;`;

  const expandedSyntax = await describeAttempt(() =>
    queryIgdb<ExternalGame>(
      "/external_games",
      `fields uid, external_game_source, ${EXPANDED_GAME_FIELDS}; ${where}`
    )
  );
  const braceShorthandSyntax = await describeAttempt(() =>
    queryIgdb<ExternalGame>(
      "/external_games",
      `fields uid, external_game_source, ${BRACE_SHORTHAND_GAME_FIELDS}; ${where}`
    )
  );

  const expandedRows = expandedSyntax.ok ? (expandedSyntax.rows ?? []) : [];
  return {
    generatedAt: new Date().toISOString(),
    sources,
    steamSource,
    expandedSyntax: {
      ok: expandedSyntax.ok,
      error: expandedSyntax.ok ? null : expandedSyntax.error,
      totalRows: expandedSyntax.ok ? expandedSyntax.rowCount : null,
      perUid: summariseSampleByUid(expandedRows),
      distinctGameTypes: [
        ...new Set(expandedRows.map((row) => row.game?.game_type ?? null)),
      ],
      firstRow: expandedRows[0] ?? null,
    },
    braceShorthandSyntax: {
      ok: braceShorthandSyntax.ok,
      error: braceShorthandSyntax.ok ? null : braceShorthandSyntax.error,
      totalRows: braceShorthandSyntax.ok ? braceShorthandSyntax.rowCount : null,
    },
  };
}

try {
  const report = await inspectExternalGameSources();
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
