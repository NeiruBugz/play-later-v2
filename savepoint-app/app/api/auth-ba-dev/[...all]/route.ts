import { auth } from "@/auth.better";
import { env } from "@/env.mjs";
import { toNextJsHandler } from "better-auth/next-js";

function notFound(): Response {
  return new Response(null, { status: 404 });
}

const baHandlers = toNextJsHandler(auth);

export function GET(request: Request): Promise<Response> {
  if (env.NODE_ENV === "production") return Promise.resolve(notFound());
  return baHandlers.GET(request);
}

export function POST(request: Request): Promise<Response> {
  if (env.NODE_ENV === "production") return Promise.resolve(notFound());
  return baHandlers.POST(request);
}
