import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { syncWaveData } from "@/lib/sync/wave";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const result = await syncWaveData(user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Wave sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync Wave data",
      },
      { status: 500 }
    );
  }
}
