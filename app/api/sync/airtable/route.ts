import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { syncAirtableData } from "@/lib/sync/airtable";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const result = await syncAirtableData(user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Airtable sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync Airtable data",
      },
      { status: 500 }
    );
  }
}
