import { endOfYear, format, parse, parseISO } from "date-fns";

export function isoToReadable(iso: string) {
  return format(parseISO(iso), "yyyy");
}

export function convertUnixToHumanReadable(unixTimestamp: number) {
  const date = new Date(unixTimestamp * 1000);
  return format(date, "MMM dd, yyyy");
}

export function convertReleaseDateToIsoStringDate(
  releaseDate: string | undefined
): string | null {
  if (!releaseDate) {
    return null;
  }

  try {
    const fullDate = parse(releaseDate, "MMM dd, yyyy", new Date());
    return fullDate.toISOString();
  } catch {
    const yearMatch = releaseDate.match(/\b(\d{4})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      const yearEndDate = endOfYear(new Date(year, 0, 1));
      return yearEndDate.toISOString();
    }
  }

  return null;
}
