import { describe, expect, it } from "vitest";

import {
  isSteamApiUnavailableError,
  isSteamPrivacyError,
  isSteamProfileNotFoundError,
  isSteamRateLimitError,
} from "./utils";

describe("isSteamPrivacyError", () => {
  it("returns true for Steam privacy error messages", () => {
    expect(
      isSteamPrivacyError(
        "Your Steam profile game details are set to private. To import your library, please set your game details to public in Steam Privacy Settings."
      )
    ).toBe(true);

    expect(isSteamPrivacyError("Your Steam profile is set to private")).toBe(
      true
    );
  });

  it("returns true for case-insensitive variations", () => {
    expect(isSteamPrivacyError("STEAM PRIVACY SETTINGS required")).toBe(true);
    expect(isSteamPrivacyError("steam privacy issue detected")).toBe(true);
  });

  it("returns false for non-privacy Steam errors", () => {
    expect(isSteamPrivacyError("Steam API is unavailable")).toBe(false);
    expect(isSteamPrivacyError("Failed to connect to Steam")).toBe(false);
    expect(isSteamPrivacyError("Invalid Steam ID")).toBe(false);
  });

  it("returns false for generic errors", () => {
    expect(isSteamPrivacyError("Network error")).toBe(false);
    expect(isSteamPrivacyError("Something went wrong")).toBe(false);
    expect(isSteamPrivacyError("")).toBe(false);
  });

  it("returns false when only one keyword is present", () => {
    expect(isSteamPrivacyError("Privacy settings needed")).toBe(false);
    expect(isSteamPrivacyError("Steam connection failed")).toBe(false);
  });
});

describe("isSteamProfileNotFoundError", () => {
  it("returns true for 'profile not found' messages", () => {
    expect(isSteamProfileNotFoundError("Steam profile not found")).toBe(true);
    expect(isSteamProfileNotFoundError("PROFILE NOT FOUND")).toBe(true);
    expect(
      isSteamProfileNotFoundError(
        "We couldn't find a Steam profile with that ID"
      )
    ).toBe(true);
  });

  it("returns true for 'invalid steam id' messages", () => {
    expect(isSteamProfileNotFoundError("Invalid Steam ID")).toBe(true);
    expect(isSteamProfileNotFoundError("INVALID STEAM ID")).toBe(true);
    expect(
      isSteamProfileNotFoundError(
        "Invalid Steam ID. Please provide a 17-digit Steam ID64 or a valid Steam vanity URL."
      )
    ).toBe(true);
  });

  it("returns false for unrelated error messages", () => {
    expect(isSteamProfileNotFoundError("Network error")).toBe(false);
    expect(isSteamProfileNotFoundError("Something went wrong")).toBe(false);
    expect(isSteamProfileNotFoundError("Steam privacy settings error")).toBe(
      false
    );
  });

  it("returns false for empty string", () => {
    expect(isSteamProfileNotFoundError("")).toBe(false);
  });
});

describe("isSteamApiUnavailableError", () => {
  it("returns true for 'temporarily unavailable' messages", () => {
    expect(
      isSteamApiUnavailableError(
        "Steam is temporarily unavailable. Please try again later."
      )
    ).toBe(true);
    expect(
      isSteamApiUnavailableError(
        "The service is TEMPORARILY UNAVAILABLE at this time"
      )
    ).toBe(true);
  });

  it("returns true for 'Steam unavailable' variations", () => {
    expect(isSteamApiUnavailableError("Steam is unavailable")).toBe(true);
    expect(isSteamApiUnavailableError("Steam service unavailable")).toBe(true);
    expect(isSteamApiUnavailableError("STEAM IS UNAVAILABLE")).toBe(true);
  });

  it("returns true for 'try again later' messages with Steam keyword", () => {
    expect(
      isSteamApiUnavailableError("Steam API error. Please try again later.")
    ).toBe(true);
    expect(
      isSteamApiUnavailableError("STEAM - TRY AGAIN LATER, please")
    ).toBe(true);
  });

  it("returns false for non-Steam unavailability errors", () => {
    expect(isSteamApiUnavailableError("Network error")).toBe(false);
    expect(isSteamApiUnavailableError("Steam profile not found")).toBe(false);
    expect(isSteamApiUnavailableError("Steam profile is private")).toBe(false);
    expect(isSteamApiUnavailableError("Rate limit exceeded")).toBe(false);
  });

  it("returns false for generic 'try again' messages without Steam keyword", () => {
    expect(isSteamApiUnavailableError("Please try again later")).toBe(false);
    expect(isSteamApiUnavailableError("Service unavailable")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isSteamApiUnavailableError("")).toBe(false);
  });
});

describe("isSteamRateLimitError", () => {
  it("returns true for 'too many requests' messages", () => {
    expect(isSteamRateLimitError("Too many requests")).toBe(true);
    expect(
      isSteamRateLimitError(
        "Too many requests to Steam. Please wait and try again."
      )
    ).toBe(true);
    expect(isSteamRateLimitError("TOO MANY REQUESTS detected")).toBe(true);
  });

  it("returns true for 'rate limit' messages", () => {
    expect(isSteamRateLimitError("Rate limit exceeded")).toBe(true);
    expect(isSteamRateLimitError("RATE LIMIT reached")).toBe(true);
    expect(
      isSteamRateLimitError("You have hit the rate limit for Steam API")
    ).toBe(true);
  });

  it("returns true for 'wait and try again' variations", () => {
    expect(
      isSteamRateLimitError("Please wait a moment and try again")
    ).toBe(true);
    expect(isSteamRateLimitError("Wait before you try again")).toBe(true);
    expect(isSteamRateLimitError("WAIT - TRY AGAIN in a minute")).toBe(true);
  });

  it("returns false for non-rate-limit errors", () => {
    expect(isSteamRateLimitError("Steam is unavailable")).toBe(false);
    expect(isSteamRateLimitError("Profile not found")).toBe(false);
    expect(isSteamRateLimitError("Network error")).toBe(false);
    expect(isSteamRateLimitError("Invalid Steam ID")).toBe(false);
  });

  it("returns false for generic 'try again' messages without wait/rate keywords", () => {
    expect(isSteamRateLimitError("Please try again later")).toBe(false);
    expect(isSteamRateLimitError("Try again")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isSteamRateLimitError("")).toBe(false);
  });
});
