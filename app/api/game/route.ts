import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { deleteGame } from "@/app/(features)/(protected)/library/lib/actions/delete-game";
import { updateStatus } from "@/app/(features)/(protected)/library/lib/actions/update-game";

export async function POST(req: Request) {
  const { status, gameId } = await req.json();

  try {
    await updateStatus(gameId, status);
    revalidatePath(`/library/${gameId}`);
    return NextResponse.json({ status: 200, success: true });
  } catch (error) {
    return NextResponse.json({ status: 500, success: false });
  }
}

export async function DELETE(req: Request) {
  const { gameId } = await req.json();

  try {
    await deleteGame(gameId);
    revalidatePath(`/library`);
    return NextResponse.json({ status: 200, success: true });
  } catch (error) {
    return NextResponse.json({ status: 500, success: false });
  }
}
