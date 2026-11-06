import { createFileRoute } from "@tanstack/react-router";

import { buildManifest } from "@/shared/config/site";

export const Route = createFileRoute("/manifest.json")({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify(buildManifest()), {
          headers: { "Content-Type": "application/manifest+json" },
        }),
    },
  },
});
