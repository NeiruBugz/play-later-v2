import { createFileRoute } from "@tanstack/react-router";

import { auth } from "@/shared/lib/auth/auth.server";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger({ scope: "auth-handler" });

async function handle(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname;
  const method = request.method;
  log.info({ method, path }, "auth request");
  try {
    return await auth.handler(request);
  } catch (err) {
    log.error({ err, method, path }, "auth handler failed");
    throw err;
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
