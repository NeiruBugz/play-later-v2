// @vitest-environment node
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createClientRpc } from "@tanstack/start-client-core/client-rpc";
import { describe, expect, it } from "vitest";

import { registerServerFn } from "../../../test/support/server-fn-resolver";
import { startInstance } from "../../start";
import { ConflictError, NotFoundError } from "./errors";
import { getUserFacingErrorMessage } from "./user-facing-error";

const START_STORAGE_KEY = Symbol.for("tanstack-start:start-storage-context");
const EVENT_STORAGE_KEY = Symbol.for("tanstack-start:event-storage");

type Storage = { run: <T>(store: unknown, fn: () => T) => T };
const globals = globalThis as unknown as Record<symbol, Storage>;

const SERVER_FN_ID = "app-error-serialization-test";
process.env.TSS_SERVER_FN_BASE = "http://localhost/_serverFn/";

async function loadRealServerFnHandler() {
  const requireFromReactStart = createRequire(
    createRequire(import.meta.url).resolve("@tanstack/react-start/package.json")
  );
  const serverCorePackage = requireFromReactStart.resolve(
    "@tanstack/start-server-core/package.json"
  );
  const handlerFile = serverCorePackage.replace(
    "package.json",
    "dist/esm/server-functions-handler.js"
  );
  return (await import(/* @vite-ignore */ pathToFileURL(handlerFile).href)) as {
    handleServerAction: (opts: {
      request: Request;
      context: Record<string, unknown>;
      serverFnId: string;
    }) => Promise<Response>;
  };
}

async function callServerFnThatThrows(error: Error): Promise<unknown> {
  registerServerFn(SERVER_FN_ID, async () => ({ error }));
  const { handleServerAction } = await loadRealServerFnHandler();
  const startOptions = await startInstance.getOptions();

  const inStartContext = <T>(fn: () => T): T =>
    globals[EVENT_STORAGE_KEY]!.run(
      { h3Event: { res: { status: 200, statusText: "" } } },
      () => globals[START_STORAGE_KEY]!.run({ startOptions }, fn)
    );

  const serverFetch = (url: string | URL | Request, init?: RequestInit) => {
    const request = new Request(url, init);
    return inStartContext(() =>
      handleServerAction({ request, context: {}, serverFnId: SERVER_FN_ID })
    );
  };

  const response = (await inStartContext(() =>
    createClientRpc(SERVER_FN_ID)({
      method: "POST",
      data: {},
      fetch: serverFetch,
    })
  )) as { error?: unknown };
  if (!response.error) throw new Error("server fn did not return an error");
  return response.error;
}

describe("AppError over the real server-fn handler and client fetcher", () => {
  it("delivers ConflictError code and context.code to the client", async () => {
    const received = (await callServerFnThatThrows(
      new ConflictError("Up Next is full", { code: "UP_NEXT_FULL" })
    )) as ConflictError;

    expect(received).toBeInstanceOf(ConflictError);
    expect(received.message).toBe("Up Next is full");
    expect(received.code).toBe("CONFLICT");
    expect(received.context).toEqual({ code: "UP_NEXT_FULL" });
    expect(getUserFacingErrorMessage(received)).toBe(
      "Up Next holds 5 games. Remove one to add this."
    );
  });

  it("delivers NotFoundError with code NOT_FOUND and keeps server-side context off the client", async () => {
    const received = (await callServerFnThatThrows(
      new NotFoundError("Library item not found", { userId: "u1", itemId: 5 })
    )) as NotFoundError;

    expect(received).toBeInstanceOf(NotFoundError);
    expect(received.code).toBe("NOT_FOUND");
    expect(received.context).toBeUndefined();
    expect(JSON.stringify(received)).not.toContain("u1");
  });

  it("still delivers plain errors as errors with their message", async () => {
    const received = (await callServerFnThatThrows(new Error("boom"))) as Error;

    expect(received).toBeInstanceOf(Error);
    expect(received.message).toBe("boom");
  });
});
