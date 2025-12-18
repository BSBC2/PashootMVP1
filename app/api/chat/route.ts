import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { processFinancialQuery, checkChatQuota } from "@/lib/ai/chat";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Check quota
    const quota = await checkChatQuota(user.id);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `You've reached your monthly limit of ${quota.limit} queries. Upgrade for unlimited access.`,
        },
        { status: 429 }
      );
    }

    // Save user message
    await db.chatMessage.create({
      data: {
        userId: user.id,
        role: "user",
        content: message,
      },
    });

    // Process query with Claude
    const response = await processFinancialQuery(user.id, message);

    // Save assistant response
    await db.chatMessage.create({
      data: {
        userId: user.id,
        role: "assistant",
        content: response,
      },
    });

    return NextResponse.json({
      response,
      quota: {
        used: quota.used + 1,
        limit: quota.limit,
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process message",
      },
      { status: 500 }
    );
  }
}
