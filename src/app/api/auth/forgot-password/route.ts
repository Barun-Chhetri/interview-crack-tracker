import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    let resetToken = null;

    if (user) {
      // Generate secure single-use token valid for 1 hour
      resetToken = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry: expiry,
        },
      });
    }

    // Never disclose whether email was found or not
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, password reset instructions have been sent.",
      // In development mode only, return resetToken to facilitate testing when SMTP is not configured
      ...(process.env.NODE_ENV !== "production" && resetToken ? { devResetToken: resetToken } : {}),
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
