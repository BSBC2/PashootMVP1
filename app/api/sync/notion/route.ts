import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { syncNotionData } from "@/lib/sync/notion";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const result = await syncNotionData(user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Notion sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync Notion data",
      },
      { status: 500 }
    );
  }
}
