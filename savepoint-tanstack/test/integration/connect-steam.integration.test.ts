/**
 * RED integration test for connectSteamWorker (Slice 21 Phase B).
 *
 * Worker signature (locked):
 *   connectSteamWorker(
 *     userId: string | undefined,
 *     data: unknown,
 *   ): Promise<{ steamId: string }>
 *
 * Input shape (Zod-validated inside worker):
 *   const CONNECT_STEAM_INPUT = z.object({
 *     params: z.record(z.string(), z.string()),
 *   });
 *
 * Behaviour contract:
 *   - userId === undefined         → throws UnauthorizedError, no DB write.
 *   - data.params shape invalid    → throws ZodError, no DB write.
 *   - Steam confirms is_valid:true → writes steamId64 onto the user row,
 *                                    returns { steamId }.
 *   - Steam responds is_valid:false → throws ValidationError (bubbled from
 *                                    verifyOpenIdResponse), no DB write.
 *   - openid.mode missing/invalid  → throws ValidationError, no DB write.
 *
 * Network/upstream failure is covered by the Phase-A openid.integration suite;
 * not re-tested here because the worker delegates verbatim.
 */
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// RED import — module does not exist until the GREEN step.
import { connectSteamWorker } from "@/features/steam-connect/api/connect-steam.worker";
import { UnauthorizedError, ValidationError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("connect-steam");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const USER_ID = "cs-user-alice";
const STEAM_ID_64 = "76561198012345678";

const VALID_PARAMS: Record<string, string> = {
  "openid.mode": "id_res",
  "openid.ns": "http://specs.openid.net/auth/2.0",
  "openid.claimed_id": `https://steamcommunity.com/openid/id/${STEAM_ID_64}`,
  "openid.identity": `https://steamcommunity.com/openid/id/${STEAM_ID_64}`,
  "openid.return_to": "http://localhost:6061/steam/callback",
  "openid.sig": "test-signature",
  "openid.signed":
    "signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle",
  "openid.assoc_handle": "12345",
  "openid.response_nonce": "2026-05-20T00:00:00Zabcdef",
  "openid.op_endpoint": "https://steamcommunity.com/openid/login",
};

function makeFetchResponse(init: {
  ok: boolean;
  status?: number;
  body: string;
}): Response {
  return {
    ok: init.ok,
    status: init.status ?? (init.ok ? 200 : 500),
    statusText: init.ok ? "OK" : "Error",
    headers: new Headers(),
    text: async () => init.body,
  } as unknown as Response;
}

function stubSteamIsValid() {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        makeFetchResponse({ ok: true, body: "ns:http://...\nis_valid:true\n" })
      )
  );
}

function stubSteamIsInvalid() {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        makeFetchResponse({ ok: true, body: "ns:http://...\nis_valid:false\n" })
      )
  );
}

// ---------------------------------------------------------------------------
// Common setup: one user with no steamId64.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.prisma.user.deleteMany();
  await db.prisma.user.create({
    data: {
      id: USER_ID,
      email: "cs-alice@example.com",
      name: "CS Alice",
      emailVerified: true,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("connectSteamWorker", () => {
  describe("auth gate", () => {
    it("throws UnauthorizedError when userId is undefined", async () => {
      stubSteamIsValid();
      await expect(
        connectSteamWorker(undefined, { params: VALID_PARAMS })
      ).rejects.toThrow(UnauthorizedError);
    });

    it("does not write steamId64 when unauthenticated", async () => {
      stubSteamIsValid();
      await expect(
        connectSteamWorker(undefined, { params: VALID_PARAMS })
      ).rejects.toThrow(UnauthorizedError);

      const user = await db.prisma.user.findUnique({
        where: { id: USER_ID },
        select: { steamId64: true },
      });
      expect(user?.steamId64).toBeNull();
    });
  });

  describe("happy path — Steam confirms is_valid:true", () => {
    beforeEach(() => {
      stubSteamIsValid();
    });

    it("returns { steamId } with the verified Steam64 id", async () => {
      const result = await connectSteamWorker(USER_ID, {
        params: VALID_PARAMS,
      });
      expect(result).toEqual({ steamId: STEAM_ID_64 });
    });

    it("writes steamId64 onto the user row", async () => {
      await connectSteamWorker(USER_ID, { params: VALID_PARAMS });

      const user = await db.prisma.user.findUnique({
        where: { id: USER_ID },
        select: { steamId64: true },
      });
      expect(user?.steamId64).toBe(STEAM_ID_64);
    });

    it("is idempotent — calling twice leaves the same steamId64", async () => {
      await connectSteamWorker(USER_ID, { params: VALID_PARAMS });
      await connectSteamWorker(USER_ID, { params: VALID_PARAMS });

      const user = await db.prisma.user.findUnique({
        where: { id: USER_ID },
        select: { steamId64: true },
      });
      expect(user?.steamId64).toBe(STEAM_ID_64);
    });
  });

  describe("forged signature — Steam responds is_valid:false", () => {
    beforeEach(() => {
      stubSteamIsInvalid();
    });

    it("throws ValidationError", async () => {
      await expect(
        connectSteamWorker(USER_ID, { params: VALID_PARAMS })
      ).rejects.toThrow(ValidationError);
    });

    it("does not write steamId64 on forged signature", async () => {
      await expect(
        connectSteamWorker(USER_ID, { params: VALID_PARAMS })
      ).rejects.toThrow(ValidationError);

      const user = await db.prisma.user.findUnique({
        where: { id: USER_ID },
        select: { steamId64: true },
      });
      expect(user?.steamId64).toBeNull();
    });
  });

  describe("missing/invalid OpenID params", () => {
    it("throws ValidationError when openid.mode is not id_res", async () => {
      stubSteamIsValid();
      const badParams = { ...VALID_PARAMS, "openid.mode": "cancel" };
      await expect(
        connectSteamWorker(USER_ID, { params: badParams })
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when claimed_id is missing", async () => {
      stubSteamIsValid();
      const { "openid.claimed_id": _drop, ...rest } = VALID_PARAMS;
      void _drop;
      await expect(
        connectSteamWorker(USER_ID, { params: rest })
      ).rejects.toThrow(ValidationError);
    });

    it("does not write steamId64 on invalid params", async () => {
      stubSteamIsValid();
      const badParams = { ...VALID_PARAMS, "openid.mode": "cancel" };
      await expect(
        connectSteamWorker(USER_ID, { params: badParams })
      ).rejects.toThrow(ValidationError);

      const user = await db.prisma.user.findUnique({
        where: { id: USER_ID },
        select: { steamId64: true },
      });
      expect(user?.steamId64).toBeNull();
    });
  });
});
