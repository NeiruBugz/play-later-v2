import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { IgdbService } from "@/shared/services";

const igdbService = new IgdbService();

// Validation schema for the game ID parameter
const GameIdSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error("Invalid game ID");
    }
    return num;
  }),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate the game ID parameter
    const validationResult = GameIdSchema.safeParse({ id: params.id });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid game ID parameter",
          cause: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { id: gameId } = validationResult.data;

    // Call service layer
    const result = await igdbService.getGameDetails({ gameId });

    if (!result.success) {
      const statusCode = result.error?.includes("Invalid") ? 400 : 500;
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get game details", cause: error },
      { status: 500 }
    );
  }
}
