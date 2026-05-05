import { env } from "@env";
import { createServerFn } from "@tanstack/react-start";

export const getCredentialsEnabledFn = createServerFn({
  method: "GET",
}).handler(async (): Promise<{ credentialsEnabled: boolean }> => {
  return {
    credentialsEnabled:
      env.AUTH_ENABLE_CREDENTIALS === "true" && env.NODE_ENV !== "production",
  };
});
