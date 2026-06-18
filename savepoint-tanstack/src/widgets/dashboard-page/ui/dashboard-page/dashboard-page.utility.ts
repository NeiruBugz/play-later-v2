const DAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

export function buildEyebrowDate(now: Date): string {
  const day = DAYS[now.getDay()];
  const month = MONTHS[now.getMonth()];
  const date = now.getDate();
  return `// ${day} · ${month} ${date}`;
}

export function buildGreeting(now: Date, username: string): string {
  const hour = now.getHours();
  const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return `Good ${period}, ${username}.`;
}
