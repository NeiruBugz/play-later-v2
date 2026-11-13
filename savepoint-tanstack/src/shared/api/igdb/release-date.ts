import { createLogger } from "@/shared/lib";

const logger = createLogger({ service: "igdb-release-date" });

export type IgdbReleasePrecision = "DAY" | "MONTH" | "QUARTER" | "YEAR" | "TBA";

export const DATE_FORMAT_PRECISION = {
  0: "DAY",
  1: "MONTH",
  2: "YEAR",
  3: "QUARTER",
  4: "QUARTER",
  5: "QUARTER",
  6: "QUARTER",
  7: "TBA",
} as const satisfies Record<number, IgdbReleasePrecision>;

const FIRST_QUARTER_FORMAT_ID = 3;
const MONTHS_PER_QUARTER = 3;
const MILLISECONDS_PER_DAY = 86_400_000;

type DatedPrecision = Exclude<IgdbReleasePrecision, "TBA">;

const MOST_PRECISE_FIRST: readonly DatedPrecision[] = [
  "DAY",
  "MONTH",
  "QUARTER",
  "YEAR",
];

type IgdbReleaseDateEntry = {
  date?: number | undefined;
  date_format?: number | undefined;
  y?: number | undefined;
  m?: number | undefined;
};

type IgdbReleaseDateSource = {
  first_release_date?: number | null | undefined;
  release_dates?: readonly IgdbReleaseDateEntry[] | undefined;
};

export type IgdbReleaseDateResult = {
  releaseDate: Date | null;
  precision: IgdbReleasePrecision | null;
};

const precisionByFormatId: Readonly<
  Record<number, IgdbReleasePrecision | undefined>
> = DATE_FORMAT_PRECISION;

const isDatedPrecision = (
  precision: IgdbReleasePrecision | undefined
): precision is DatedPrecision =>
  precision !== undefined && precision !== "TBA";

const hasDate = (entry: IgdbReleaseDateEntry): boolean =>
  entry.date !== undefined;

const isTbdOrUndated = (entry: IgdbReleaseDateEntry): boolean =>
  !hasDate(entry) || precisionByFormatId[entry.date_format ?? -1] === "TBA";

const readNoFirstReleaseDate = (
  entries: readonly IgdbReleaseDateEntry[]
): IgdbReleaseDateResult =>
  entries.length > 0 && entries.every(isTbdOrUndated)
    ? { releaseDate: null, precision: "TBA" }
    : { releaseDate: null, precision: null };

const periodStart = (
  precision: DatedPrecision,
  entry: IgdbReleaseDateEntry,
  firstReleaseDateSeconds: number
): Date | undefined => {
  if (precision === "DAY") {
    const milliseconds = firstReleaseDateSeconds * 1000;
    return new Date(
      Math.floor(milliseconds / MILLISECONDS_PER_DAY) * MILLISECONDS_PER_DAY
    );
  }
  const { y: year, m: month, date_format: formatId } = entry;
  if (year === undefined) return undefined;
  if (precision === "YEAR") return new Date(Date.UTC(year, 0, 1));
  if (precision === "MONTH") {
    return month === undefined
      ? undefined
      : new Date(Date.UTC(year, month - 1, 1));
  }
  return formatId === undefined
    ? undefined
    : new Date(
        Date.UTC(
          year,
          (formatId - FIRST_QUARTER_FORMAT_ID) * MONTHS_PER_QUARTER,
          1
        )
      );
};

export function mapIgdbReleaseDate(
  item: IgdbReleaseDateSource
): IgdbReleaseDateResult | "unknown" {
  const entries = item.release_dates ?? [];
  const firstReleaseDate = item.first_release_date;

  if (firstReleaseDate === undefined || firstReleaseDate === null) {
    return readNoFirstReleaseDate(entries);
  }

  const candidates = entries.filter((entry) => entry.date === firstReleaseDate);
  const datedCandidates = candidates.flatMap((entry) => {
    const precision = precisionByFormatId[entry.date_format ?? -1];
    return isDatedPrecision(precision) ? [{ entry, precision }] : [];
  });

  const mostPrecise = MOST_PRECISE_FIRST.flatMap((precision) =>
    datedCandidates.filter((candidate) => candidate.precision === precision)
  )[0];

  if (!mostPrecise) {
    if (candidates.length > 0) {
      logger.warn(
        { dateFormats: candidates.map((entry) => entry.date_format) },
        "IGDB release entry has an unrecognised date format"
      );
    }
    return "unknown";
  }

  const releaseDate = periodStart(
    mostPrecise.precision,
    mostPrecise.entry,
    firstReleaseDate
  );
  if (!releaseDate) {
    logger.warn(
      { dateFormat: mostPrecise.entry.date_format },
      "IGDB release entry is missing the year or month its date format needs"
    );
    return "unknown";
  }

  return { releaseDate, precision: mostPrecise.precision };
}
