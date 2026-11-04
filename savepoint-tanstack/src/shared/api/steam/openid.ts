/**
 * Steam OpenID 2.0 `check_authentication` signature verification.
 *
 * Steam's OpenID flow is: the user clicks "Sign in through Steam" → Steam
 * redirects back to our return-to URL with a bundle of `openid.*` query
 * params. To trust them, we POST the *same* params back to Steam (with
 * `openid.mode = check_authentication`) and look for `is_valid:true` in
 * the response body. That's the entire protocol.
 *
 * Public surface:
 *   verifyOpenIdResponse(params, { userId }): Promise<string>
 *     - Throws ValidationError on bad inputs OR is_valid:false response.
 *       Rationale: bad/forged OpenID params are CALLER INPUT being invalid,
 *       not an upstream failure.
 *     - Throws UpstreamError on network failure or non-2xx from Steam.
 *     - Returns the verified Steam64 ID on success.
 *
 * Beyond Steam's signature check, the response must target this app's
 * callback, come from Steam's endpoint, sign the identity fields and carry a
 * short-lived state bound to `userId` (see login-state.server.ts).
 *
 * Pure function — no internal state, idempotent across re-invocations
 * with the same params.
 */
import { env } from "@env";

import { createLogger } from "@/shared/lib";
import { UpstreamError, ValidationError } from "@/shared/lib/errors";

import { isValidSteamLoginState } from "./login-state.server";

const logger = createLogger({ service: "steam-openid" });

export const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
export const STEAM_CALLBACK_PATH = "/steam/callback";
const CLAIMED_ID_PATTERN = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;
const REQUIRED_SIGNED_FIELDS = [
  "op_endpoint",
  "claimed_id",
  "identity",
  "return_to",
  "response_nonce",
] as const;

function reject(reason: string): never {
  logger.warn({ reason }, "Steam OpenID response rejected");
  throw new ValidationError("Invalid OpenID response", { reason });
}

function assertSignedFields(params: Record<string, string>): void {
  const signed = new Set((params["openid.signed"] ?? "").split(","));
  for (const field of REQUIRED_SIGNED_FIELDS) {
    if (!signed.has(field)) reject(`${field} is not covered by the signature`);
  }
}

function assertReturnToBoundToUser(
  returnTo: string | undefined,
  userId: string
): void {
  let url: URL;
  try {
    url = new URL(returnTo ?? "");
  } catch {
    return reject("return_to is not a URL");
  }
  const expected = new URL(STEAM_CALLBACK_PATH, env.BETTER_AUTH_URL);
  if (url.origin !== expected.origin || url.pathname !== expected.pathname) {
    reject("return_to does not point at this app's callback");
  }
  const state = url.searchParams.get("state");
  if (
    !state ||
    !isValidSteamLoginState({
      state,
      userId,
      secret: env.BETTER_AUTH_SECRET,
    })
  ) {
    reject("login state is missing, expired or bound to another user");
  }
}

export async function verifyOpenIdResponse(
  params: Record<string, string>,
  { userId }: { userId: string }
): Promise<string> {
  const mode = params["openid.mode"];
  if (mode !== "id_res") {
    logger.warn({ mode }, "OpenID mode is not id_res");
    throw new ValidationError("Invalid OpenID mode", { mode });
  }

  if (params["openid.op_endpoint"] !== STEAM_OPENID_URL) {
    reject("op_endpoint is not Steam");
  }

  const claimedId = params["openid.claimed_id"];
  if (!claimedId) {
    logger.warn("OpenID claimed_id missing");
    throw new ValidationError("Missing claimed_id");
  }

  const steamId64 = CLAIMED_ID_PATTERN.exec(claimedId)?.[1];
  if (!steamId64) {
    logger.warn({ claimedId }, "OpenID claimed_id is not a Steam identity");
    throw new ValidationError("Could not extract Steam ID from claimed_id", {
      claimedId,
    });
  }
  if (params["openid.identity"] !== claimedId) {
    reject("identity differs from claimed_id");
  }

  assertSignedFields(params);
  assertReturnToBoundToUser(params["openid.return_to"], userId);

  const verifyParams = new URLSearchParams(params);
  verifyParams.set("openid.mode", "check_authentication");

  let res: Response;
  try {
    res = await fetch(STEAM_OPENID_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyParams.toString(),
    });
  } catch (err) {
    logger.error(
      { err: (err as Error)?.message },
      "Steam OpenID verification: network failure"
    );
    throw new UpstreamError("Steam OpenID verification failed", {
      cause: (err as Error)?.message,
    });
  }

  if (!res.ok) {
    logger.error(
      { status: res.status, statusText: res.statusText },
      "Steam OpenID verification: non-2xx"
    );
    throw new UpstreamError("Steam OpenID verification failed", {
      status: res.status,
    });
  }

  const text = await res.text();
  const isValid = text.includes("is_valid:true");
  if (!isValid) {
    logger.warn({ claimedId }, "Steam OpenID signature invalid");
    throw new ValidationError("Invalid OpenID signature", { claimedId });
  }

  return steamId64;
}
