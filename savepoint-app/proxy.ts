import { NextResponse, type NextRequest } from "next/server";

import { HSTS_MAX_AGE_SECONDS } from "@/shared/constants";

const LEGACY_SESSION_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;

const LEGACY_CSRF_COOKIES = [
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
] as const;

const ALL_LEGACY_COOKIES = [
  ...LEGACY_SESSION_COOKIES,
  ...LEGACY_CSRF_COOKIES,
] as const;

const MIGRATION_FLAG_COOKIE = "auth_migrated";
const MIGRATION_FLAG_MAX_AGE = 600;

/**
 * Reads the cutover timestamp directly from process.env instead of importing
 * @/env.mjs. The env.mjs module uses @t3-oss/env-nextjs which pulls in
 * Node.js-only internals that are not available in the Edge runtime.
 */
function isPostCutover(now: Date): boolean {
  const raw = process.env.AUTH_MIGRATION_CUTOVER_AT;
  if (!raw) return false;

  const cutoverAt = new Date(raw);
  if (isNaN(cutoverAt.getTime())) return false;

  return now >= cutoverAt;
}

function hasLegacyCookies(request: NextRequest): boolean {
  return ALL_LEGACY_COOKIES.some((name) => request.cookies.has(name));
}

/**
 * Detects stale NextAuth session cookies post-cutover, clears them, and sets
 * the auth_migrated flag so the login page can show a one-shot notice.
 *
 * Extracted as a pure function so unit tests can call it with synthetic
 * NextRequest objects without going through the full proxy stack.
 *
 * Returns null when no action is needed (caller applies only security headers).
 */
export function handleForcedSignOut(request: NextRequest, now: Date): boolean {
  if (!isPostCutover(now)) return false;

  const onLoginPage = request.nextUrl.pathname === "/login";
  const hasMigrationFlag = request.cookies.has(MIGRATION_FLAG_COOKIE);

  if (onLoginPage && hasMigrationFlag) return false;

  return hasLegacyCookies(request);
}

function applySecurityHeaders(response: NextResponse): void {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://images.igdb.com https://steamcdn-a.akamaihd.net https://avatars.steamstatic.com https://cdn.cloudflare.steamstatic.com data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
  response.headers.set(
    "Strict-Transport-Security",
    `max-age=${HSTS_MAX_AGE_SECONDS}; includeSubDomains`
  );
}

export function proxy(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  applySecurityHeaders(response);

  if (handleForcedSignOut(request, new Date())) {
    for (const name of ALL_LEGACY_COOKIES) {
      if (request.cookies.has(name)) {
        const requiresSecurePrefix =
          name.startsWith("__Secure-") || name.startsWith("__Host-");
        response.cookies.set(name, "", {
          maxAge: 0,
          path: "/",
          ...(requiresSecurePrefix && { secure: true }),
        });
      }
    }

    response.cookies.set(MIGRATION_FLAG_COOKIE, "1", {
      path: "/",
      maxAge: MIGRATION_FLAG_MAX_AGE,
      sameSite: "lax",
      httpOnly: false,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/auth|api/health|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)$).*)",
  ],
};
