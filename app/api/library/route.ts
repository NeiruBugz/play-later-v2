import { NextResponse } from "next/server";

import { saveGameToLibrary } from "@/app/(features)/(protected)/library/lib/actions/save-to-library";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    await saveGameToLibrary(data);
    return NextResponse.json({ status: 200 });
  } catch (error) {
    return NextResponse.json({ status: 500 });
  }
}
