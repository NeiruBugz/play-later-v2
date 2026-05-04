import { getCutoverAt, isInBannerWindow } from "@/features/auth/lib/cutover";

import { AuthMigrationBannerClient } from "./auth-migration-banner-client";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

function formatCutoverDate(cutoverAt: Date): string {
  const parts = dateFormatter.formatToParts(cutoverAt);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const month = get("month");
  const day = get("day");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  const dayPeriod = get("dayPeriod");
  const tz = get("timeZoneName");

  const time = dayPeriod
    ? `${hour}:${minute} ${dayPeriod}`
    : `${hour}:${minute}`;
  return `${month} ${day}, ${year} at ${time} ${tz}`.trim();
}

export function AuthMigrationBanner() {
  const cutoverAt = getCutoverAt();
  if (!cutoverAt) return null;
  if (!isInBannerWindow(new Date())) return null;

  const formatted = formatCutoverDate(cutoverAt);

  return <AuthMigrationBannerClient formattedCutoverDate={formatted} />;
}
