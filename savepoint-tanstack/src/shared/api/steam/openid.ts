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
 *   verifyOpenIdResponse(params): Promise<string>
 *     - Throws ValidationError on bad inputs OR is_valid:false response.
 *       Rationale: bad/forged OpenID params are CALLER INPUT being invalid,
 *       not an upstream failure.
 *     - Throws UpstreamError on network failure or non-2xx from Steam.
 *     - Returns the verified Steam64 ID on success.
 *
 * Pure function — no internal state, idempotent across re-invocations
 * with the same params.
 */
import { createLogger } from "@/shared/lib";
import { UpstreamError, ValidationError } from "@/shared/lib/errors";

const logger = createLogger({ service: "steam-openid" });

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_ID_FROM_CLAIMED_ID = /\/openid\/id\/(\d+)$/;

export async function verifyOpenIdResponse(
  params: Record<string, string>
): Promise<string> {
  const mode = params["openid.mode"];
  if (mode !== "id_res") {
    logger.warn({ mode }, "OpenID mode is not id_res");
    throw new ValidationError("Invalid OpenID mode", { mode });
  }

  const claimedId = params["openid.claimed_id"];
  if (!claimedId) {
    logger.warn("OpenID claimed_id missing");
    throw new ValidationError("Missing claimed_id");
  }

  const match = STEAM_ID_FROM_CLAIMED_ID.exec(claimedId);
  const steamId64 = match?.[1];
  if (!steamId64) {
    logger.warn({ claimedId }, "OpenID claimed_id has no extractable steam64");
    throw new ValidationError("Could not extract Steam ID from claimed_id", {
      claimedId,
    });
  }

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
