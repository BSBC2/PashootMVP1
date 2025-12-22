import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { syncSquareData } from "@/lib/sync/square";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const result = await syncSquareData(user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Square sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync Square data",
      },
      { status: 500 }
    );
  }
}
