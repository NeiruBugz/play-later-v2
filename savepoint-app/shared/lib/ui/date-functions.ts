import { format, parse, parseISO } from "date-fns";

const MILLISECONDS_TO_SECONDS = 1000;
const DECEMBER_MONTH_INDEX = 11;
const LAST_DAY_OF_DECEMBER = 31;
const LAST_HOUR_OF_DAY = 23;
const LAST_MINUTE_OF_HOUR = 59;
const LAST_SECOND_OF_MINUTE = 59;
const LAST_MILLISECOND_OF_SECOND = 999;
export function isoToReadable(iso: string) {
  return format(parseISO(iso), "yyyy");
}
export const getTimeStamp = (): number =>
  Math.floor(Date.now() / MILLISECONDS_TO_SECONDS);
export function convertUnixToHumanReadable(unixTimestamp: number) {
  const date = new Date(unixTimestamp * MILLISECONDS_TO_SECONDS);
  return format(date, "MMM dd, yyyy");
}
export function convertReleaseDateToIsoStringDate(
  releaseDate: string | undefined
): string | null {
  if (releaseDate === undefined) {
    return null;
  }
  try {
    const fullDate = parse(releaseDate, "MMM dd, yyyy", new Date());
    return fullDate.toISOString();
  } catch {
    const yearMatch = releaseDate.match(/\b(\d{4})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      const yearEndDate = new Date(
        Date.UTC(
          year,
          DECEMBER_MONTH_INDEX,
          LAST_DAY_OF_DECEMBER,
          LAST_HOUR_OF_DAY,
          LAST_MINUTE_OF_HOUR,
          LAST_SECOND_OF_MINUTE,
          LAST_MILLISECOND_OF_SECOND
        )
      );
      return yearEndDate.toISOString();
    }
  }
  return null;
}
