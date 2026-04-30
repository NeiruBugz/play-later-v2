import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";
import { UnauthorizedError } from "@/shared/lib/errors";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "SteamOpenIdService" });

export class SteamOpenIdService {
  private readonly steamOpenIdUrl = "https://steamcommunity.com/openid/login";
  private readonly openIdNamespace = "http://specs.openid.net/auth/2.0";

  getAuthUrl(returnUrl: string): string {
    try {
      const origin = new URL(returnUrl).origin;

      const params = new URLSearchParams({
        "openid.ns": this.openIdNamespace,
        "openid.mode": "checkid_setup",
        "openid.return_to": returnUrl,
        "openid.realm": origin,
        "openid.identity": `${this.openIdNamespace}/identifier_select`,
        "openid.claimed_id": `${this.openIdNamespace}/identifier_select`,
      });

      const authUrl = `${this.steamOpenIdUrl}?${params.toString()}`;
      logger.debug({ authUrl }, "Generated Steam OpenID auth URL");

      return authUrl;
    } catch (error) {
      logger.error({ error, returnUrl }, "Failed to generate auth URL");
      throw error;
    }
  }

  async validateCallback(params: URLSearchParams): Promise<string> {
    const mode = params.get("openid.mode");
    if (mode !== "id_res") {
      logger.warn({ mode }, "Invalid OpenID mode");
      throw new UnauthorizedError("Invalid OpenID mode", { mode });
    }

    const isValid = await this.verifySignature(params);
    if (!isValid) {
      logger.warn("Invalid OpenID signature");
      throw new UnauthorizedError("Invalid OpenID signature");
    }

    const claimedId = params.get("openid.claimed_id");
    if (!claimedId) {
      logger.warn("Missing claimed_id in OpenID response");
      throw new UnauthorizedError("Missing claimed_id");
    }

    const steamId64 = this.extractSteamId(claimedId);
    if (!steamId64) {
      logger.warn({ claimedId }, "Could not extract Steam ID from claimed_id");
      throw new UnauthorizedError("Could not extract Steam ID", { claimedId });
    }

    return steamId64;
  }

  private async verifySignature(params: URLSearchParams): Promise<boolean> {
    logger.debug("Verifying OpenID signature with Steam");

    const verifyParams = new URLSearchParams(params);
    verifyParams.set("openid.mode", "check_authentication");

    const response = await fetch(this.steamOpenIdUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyParams.toString(),
    });

    if (!response.ok) {
      logger.warn(
        { status: response.status, statusText: response.statusText },
        "Steam OpenID verification request failed"
      );
      return false;
    }

    const text = await response.text();
    const isValid = text.includes("is_valid:true");

    logger.debug({ isValid }, "OpenID signature verification result");
    return isValid;
  }

  private extractSteamId(claimedId: string): string | null {
    const steamIdMatch = claimedId.match(/\/id\/(\d+)$/);
    return steamIdMatch?.[1] ?? null;
  }
}
