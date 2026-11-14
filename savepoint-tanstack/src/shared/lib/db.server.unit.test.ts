import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const poolOptions: Record<string, unknown>[] = [];
const pools: EventEmitter[] = [];
const loggerError = vi.fn();

vi.mock("pg", () => ({
  Pool: class FakePool extends EventEmitter {
    constructor(options: Record<string, unknown>) {
      super();
      poolOptions.push(options);
      pools.push(this);
    }
    end = vi.fn();
  },
}));
vi.mock("@env", () => ({
  env: { POSTGRES_PRISMA_URL: "postgres://test", DB_POOL_MAX: 3 },
}));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: class {} }));
vi.mock("../../../shared/lib/prisma/client.ts", () => ({
  PrismaClient: class {
    ready = true;
  },
}));
vi.mock("@/shared/lib/logger", () => ({
  createLogger: () => ({ error: loggerError }),
}));

describe("db.server pool", () => {
  beforeEach(() => {
    poolOptions.length = 0;
    pools.length = 0;
    loggerError.mockClear();
    vi.resetModules();
    (globalThis as { pool?: unknown; prisma?: unknown }).pool = undefined;
    (globalThis as { pool?: unknown; prisma?: unknown }).prisma = undefined;
  });

  afterEach(() => {
    vi.resetModules();
  });

  async function touchClient() {
    const { prisma } =
      await vi.importActual<typeof import("./db.server")>("./db.server");
    void (prisma as unknown as { ready: boolean }).ready;
  }

  it("given a Lambda-sized pool, when the client is first used, then the pool is bounded with timeouts", async () => {
    await touchClient();

    expect(poolOptions[0]).toMatchObject({
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 10_000,
    });
    expect(poolOptions[0]).toMatchObject({ max: 3 });
  });

  it("given an idle client errors, when the pool emits error, then it is logged and not thrown", async () => {
    await touchClient();

    expect(() => pools[0]?.emit("error", new Error("boom"))).not.toThrow();
    expect(loggerError).toHaveBeenCalledTimes(1);
  });
});
