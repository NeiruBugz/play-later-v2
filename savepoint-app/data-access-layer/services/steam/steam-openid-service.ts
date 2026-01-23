import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "SteamOpenIdService" });

export class SteamOpenIdService extends BaseService {
  private readonly steamOpenIdUrl = "https://steamcommunity.com/openid/login";
  private readonly openIdNamespace = "http://specs.openid.net/auth/2.0";

  getAuthUrl(returnUrl: string): string {
    logger.info({ returnUrl }, "Generating Steam OpenID auth URL");

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

  async validateCallback(
    params: URLSearchParams
  ): Promise<ServiceResult<string>> {
    logger.info("Validating Steam OpenID callback");

    const mode = params.get("openid.mode");
    if (mode !== "id_res") {
      logger.warn({ mode }, "Invalid OpenID mode");
      return this.error(
        "Invalid OpenID mode",
        ServiceErrorCode.VALIDATION_ERROR
      );
    }

    try {
      const isValid = await this.verifySignature(params);
      if (!isValid) {
        logger.warn("Invalid OpenID signature");
        return this.error(
          "Invalid OpenID signature",
          ServiceErrorCode.UNAUTHORIZED
        );
      }

      const claimedId = params.get("openid.claimed_id");
      if (!claimedId) {
        logger.warn("Missing claimed_id in OpenID response");
        return this.error(
          "Missing claimed_id",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      const steamId64 = this.extractSteamId(claimedId);
      if (!steamId64) {
        logger.warn(
          { claimedId },
          "Could not extract Steam ID from claimed_id"
        );
        return this.error(
          "Could not extract Steam ID",
          ServiceErrorCode.VALIDATION_ERROR
        );
      }

      logger.info(
        { steamId64 },
        "Successfully validated Steam OpenID callback"
      );
      return this.success(steamId64);
    } catch (error) {
      logger.error({ error }, "Failed to validate Steam OpenID callback");
      return this.handleError(error, "Failed to validate OpenID callback");
    }
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
