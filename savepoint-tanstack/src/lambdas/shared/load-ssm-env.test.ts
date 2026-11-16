/**
 * RED unit test for the Lambda cold-start secret loader (spec 030 tech 2.8).
 *
 * Contract: `src/lambdas/shared/load-ssm-env.ts` exports
 *   loadSsmEnv(): Promise<void>
 * On the first call it issues ONE SSM `GetParametersCommand` with
 *   Names = `${SSM_PARAM_PREFIX}/${NAME}` for POSTGRES_PRISMA_URL,
 *   IGDB_CLIENT_ID, IGDB_CLIENT_SECRET, STEAM_API_KEY and WithDecryption: true,
 * then writes each returned value to `process.env[NAME]`. Later calls in the
 * same container do not hit SSM again (cold-start only).
 * The per-function entry (`index.ts`) does
 *   `await loadSsmEnv(); const { handler } = await import("./handler")`
 * so `handler.ts` stays free of SSM.
 * `@aws-sdk/client-ssm` is mocked; the implementer adds it exact-pinned.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.hoisted(() => vi.fn());

vi.mock("@aws-sdk/client-ssm", () => ({
  SSMClient: class {
    send = sendMock;
  },
  GetParametersCommand: class {
    constructor(public input: unknown) {}
  },
}));

const PREFIX = "/savepoint/prod/storefront-sync";
const SECRET_NAMES = [
  "POSTGRES_PRISMA_URL",
  "IGDB_CLIENT_ID",
  "IGDB_CLIENT_SECRET",
  "STEAM_API_KEY",
] as const;

const parametersFor = (values: Record<string, string>) => ({
  Parameters: Object.entries(values).map(([name, value]) => ({
    Name: `${PREFIX}/${name}`,
    Value: value,
  })),
});

const loadFreshLoader = async () => {
  vi.resetModules();
  const { loadSsmEnv } = await import("./load-ssm-env");
  return loadSsmEnv;
};

beforeEach(() => {
  sendMock.mockReset();
  vi.stubEnv("SSM_PARAM_PREFIX", PREFIX);
  for (const name of SECRET_NAMES) {
    vi.stubEnv(name, undefined);
  }
  sendMock.mockResolvedValue(
    parametersFor({
      POSTGRES_PRISMA_URL: "postgres://neon",
      IGDB_CLIENT_ID: "igdb-id",
      IGDB_CLIENT_SECRET: "igdb-secret",
      STEAM_API_KEY: "steam-key",
    })
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("loadSsmEnv", () => {
  describe("given a cold start", () => {
    it("fetches the four secrets with one decrypting call and exports them to process.env", async () => {
      const loadSsmEnv = await loadFreshLoader();

      await loadSsmEnv();

      expect(sendMock).toHaveBeenCalledTimes(1);
      const [command] = sendMock.mock.calls[0] as [{ input: unknown }];
      expect(command.input).toEqual({
        Names: SECRET_NAMES.map((name) => `${PREFIX}/${name}`),
        WithDecryption: true,
      });
      expect(process.env.POSTGRES_PRISMA_URL).toBe("postgres://neon");
      expect(process.env.IGDB_CLIENT_ID).toBe("igdb-id");
      expect(process.env.IGDB_CLIENT_SECRET).toBe("igdb-secret");
      expect(process.env.STEAM_API_KEY).toBe("steam-key");
    });
  });

  describe("given a warm container that already loaded the secrets", () => {
    it("does not call SSM again", async () => {
      const loadSsmEnv = await loadFreshLoader();
      await loadSsmEnv();

      await loadSsmEnv();

      expect(sendMock).toHaveBeenCalledTimes(1);
    });
  });
});
