// @vitest-environment node
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createClientRpc } from "@tanstack/start-client-core/client-rpc";

import { startInstance } from "../../src/start";
import { registerServerFn } from "./server-fn-resolver";

const START_STORAGE_KEY = Symbol.for("tanstack-start:start-storage-context");
const EVENT_STORAGE_KEY = Symbol.for("tanstack-start:event-storage");

type Storage = { run: <T>(store: unknown, fn: () => T) => T };
const globals = globalThis as unknown as Record<symbol, Storage>;

const SERVER_FN_ID = "server-fn-error-transport-test";
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

/**
 * Sends `error` through the real TanStack server-fn handler and the real client
 * RPC fetcher with the app's serialization adapter, and returns what the client
 * receives.
 */
export async function sendErrorThroughServerFn(error: Error): Promise<unknown> {
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
