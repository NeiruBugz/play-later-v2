import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    coverage: {
      all: true,
      exclude: [".next/", "./idea"],
      reporter: ["text", "json", "html"],
    },
  },
})
