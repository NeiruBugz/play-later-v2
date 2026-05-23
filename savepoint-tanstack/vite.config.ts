import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  // `nitro()` produces the Nitro server bundle (`.output/server/index.mjs`) the
  // `start` script runs. Locally Nitro defaults to the node-server preset; in
  // Vercel CI it auto-detects the Vercel preset via the `VERCEL` env var.
  // See docs/vercel-deployment.md. tanstackStart() must precede nitro().
  plugins: [devtools(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
});

export default config;
