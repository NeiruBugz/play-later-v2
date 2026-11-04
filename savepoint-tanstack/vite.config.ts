import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  // @dnd-kit is only reached through the lazily loaded SortableUpNextQueue, so
  // Vite discovers it late, re-optimizes deps mid-session and a second React
  // copy breaks hooks ("Cannot read properties of null (reading 'useMemo')").
  optimizeDeps: { include: ["@dnd-kit/core", "@dnd-kit/sortable"] },
  // `nitro()` produces the Nitro server bundle (`.output/server/index.mjs`) the
  // `start` script runs. Locally Nitro defaults to the node-server preset; in
  // Vercel CI it auto-detects the Vercel preset via the `VERCEL` env var.
  // See docs/vercel-deployment.md. tanstackStart() must precede nitro().
  plugins: [devtools(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
});

export default config;
