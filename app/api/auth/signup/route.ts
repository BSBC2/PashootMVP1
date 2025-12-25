import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
    });

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // Create subscription record with trial status (no Paddle customer yet)
    await db.subscription.create({
      data: {
        userId: user.id,
        paddleCustomerId: null, // Will be set when user subscribes
        status: "trialing",
        currentPeriodEnd: trialEndDate,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: "Account created successfully. Welcome to your 14-day free trial!",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
