import { createHmac, timingSafeEqual } from "node:crypto";

const STATE_TIME_TO_LIVE_MS = 10 * 60 * 1000;
const STATE_PURPOSE = "steam-openid-login";

type StateBinding = { userId: string; secret: string };

function sign({ userId, secret }: StateBinding, expiresAt: string): Buffer {
  return createHmac("sha256", secret)
    .update(`${STATE_PURPOSE}:${userId}:${expiresAt}`)
    .digest();
}

export function createSteamLoginState({
  userId,
  secret,
  now = Date.now(),
}: StateBinding & { now?: number }): string {
  const expiresAt = String(now + STATE_TIME_TO_LIVE_MS);
  const signature = sign({ userId, secret }, expiresAt).toString("base64url");
  return `${expiresAt}.${signature}`;
}

export function isValidSteamLoginState({
  state,
  userId,
  secret,
  now = Date.now(),
}: StateBinding & { state: string; now?: number }): boolean {
  const parts = state.split(".");
  if (parts.length !== 2) return false;
  const [expiresAt, signature] = parts as [string, string];
  if (!/^\d+$/.test(expiresAt) || Number(expiresAt) < now) return false;

  const expected = sign({ userId, secret }, expiresAt);
  const provided = Buffer.from(signature, "base64url");
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}
