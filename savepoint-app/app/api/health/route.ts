import { NextResponse } from "next/server";

import { prisma } from "@/shared/lib/app/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "service unavailable" },
      { status: 503 }
    );
  }
}
