import fs from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

it("harness sentinel: integration setup env vars are injected by setup file", () => {
  expect(process.env.POSTGRES_PRISMA_URL).toBeDefined();
  expect(process.env.BETTER_AUTH_SECRET).toBeDefined();
  expect(process.env.NODE_ENV).toBe("test");
});

it("harness sentinel: generated Prisma client output directory is present", () => {
  const generatedClientPath = path.resolve(
    import.meta.dirname,
    "../../shared/lib/prisma/client.ts"
  );
  expect(fs.existsSync(generatedClientPath)).toBe(true);
});
