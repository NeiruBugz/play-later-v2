import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

interface AuthModule {
  auth: {
    handler: (request: Request) => Promise<Response>;
  };
}

let authHandler: (request: Request) => Promise<Response>;
let serverBaseUrl: string;

beforeAll(async () => {
  const authServerModulePath = "../../src/shared/lib/auth/auth.server.ts";
  const mod = (await import(authServerModulePath)) as AuthModule;
  authHandler = mod.auth.handler;

  await new Promise<void>((resolve, reject) => {
    const httpServer = createServer(async (req, res) => {
      const url = `http://localhost${req.url ?? "/"}`;
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string") {
          headers[key] = value;
        }
      }

      const webRequest = new Request(url, {
        method: req.method ?? "GET",
        headers,
      });

      try {
        const webResponse = await authHandler(webRequest);
        res.writeHead(
          webResponse.status,
          Object.fromEntries(webResponse.headers.entries())
        );
        const body = await webResponse.text();
        res.end(body);
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    });

    httpServer.listen(0, "127.0.0.1", () => {
      const address = httpServer.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to get server address"));
        return;
      }
      serverBaseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });

    httpServer.on("error", reject);
  });
}, 30_000);

describe("auth handler — anonymous session", () => {
  it("GET /api/auth/get-session returns 200 with null body when no session cookie is present", async () => {
    const response = await fetch(`${serverBaseUrl}/api/auth/get-session`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(body).toBeNull();
  });
});

afterAll(async () => {
  // Server cleanup handled by process exit; no persistent resources to close.
});
