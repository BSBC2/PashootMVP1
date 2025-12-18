import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { syncGustoData } from "@/lib/sync/gusto";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const result = await syncGustoData(user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gusto sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync Gusto data",
      },
      { status: 500 }
    );
  }
}
