import "server-only";

import { NextResponse } from "next/server";

import { HTTP_STATUS } from "@/shared/config/http-codes";

import { getServerUserId } from "./session";

type AuthSuccess = { userId: string };
type AuthFailure = NextResponse;

export async function requireApiAuth(): Promise<AuthSuccess | AuthFailure> {
  const userId = await getServerUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
  }
  return { userId };
}

export function isAuthFailure(
  result: AuthSuccess | AuthFailure
): result is AuthFailure {
  return result instanceof NextResponse;
}
