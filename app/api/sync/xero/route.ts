import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { syncXeroData } from "@/lib/sync/xero";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const result = await syncXeroData(user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Xero sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync Xero data",
      },
      { status: 500 }
    );
  }
}
