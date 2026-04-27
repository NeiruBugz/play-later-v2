const MAX_BODY_TITLE_LENGTH = 80;

function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const sliced = text.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(" ");
  const cutPoint = lastSpace > 0 ? lastSpace : maxLength;
  return sliced.slice(0, cutPoint) + "…";
}

function formatDateYMD(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface EntryInput {
  title?: string | null;
  body?: string | null;
  createdAt?: Date;
}

interface GameInput {
  title: string;
}

interface DeriveEntryTitleOpts {
  date?: Date;
}

export function deriveEntryTitle(
  entry: EntryInput,
  game: GameInput,
  opts?: DeriveEntryTitleOpts
): string {
  if (entry.title?.trim()) {
    return entry.title.trim();
  }

  if (entry.body?.trim()) {
    const firstLine = entry.body
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    if (firstLine) {
      return truncateAtWordBoundary(firstLine, MAX_BODY_TITLE_LENGTH);
    }
  }

  const fallbackDate = opts?.date ?? entry.createdAt ?? new Date();
  return `${game.title} — ${formatDateYMD(fallbackDate)}`;
}
