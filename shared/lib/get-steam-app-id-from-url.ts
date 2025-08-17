import { z } from "zod";

const steamAppUrlSchema = z
  .string()
  .url()
  .refine((url) => url.includes("steampowered.com") && url.includes("/app/"), {
    message: "URL must be a valid Steam store app URL",
  })
  .transform((url) => {
    const match = url.match(/\/app\/(\d+)/i);
    if (match?.[1] == null) {
      throw new Error("Could not extract app ID from URL");
    }

    const appId = parseInt(match[1], 10);
    if (isNaN(appId)) {
      throw new Error("Extracted app ID is not a valid number");
    }

    return appId;
  });

export function getSteamAppIdFromUrl(url?: string) {
  const result = steamAppUrlSchema.safeParse(url);
  return result.success ? result.data : undefined;
}
