import { NextResponse } from "next/server";

import { addGame } from "@/app/(features)/(protected)/library/lib/actions";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    await addGame(data);
    return NextResponse.json({ status: 200 });
  } catch (error) {
    return NextResponse.json({ status: 500 });
  }
}
