import { NextResponse } from "next/server";
import { addGame } from "@/features/library/actions";

export async function POST(req: Request) {
  const data = await req.json();
  await addGame(data);
  return NextResponse.json({ status: 429 });
}
