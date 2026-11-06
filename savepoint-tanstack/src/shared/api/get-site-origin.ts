import { env } from "@env";
import { createServerFn } from "@tanstack/react-start";

export const getSiteOriginFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<string> => new URL(env.BETTER_AUTH_URL).origin
);
