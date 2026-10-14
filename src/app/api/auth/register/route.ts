import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  createToken,
  isValidEmail,
  validatePasswordStrength,
  AUTH_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      confirmPassword,
      name,
      university,
      visaStatus,
      targetRole,
    } = body;

    // 1. Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.reason },
        { status: 400 }
      );
    }

    // 2. Duplicate email check
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Create user in database with profile fields
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: (name || normalizedEmail.split("@")[0]).trim(),
        passwordHash,
        role: "USER",
        university: (university || "University of North Texas (UNT)").trim(),
        visaStatus: (visaStatus || "F-1").trim(),
        targetRole: (targetRole || "Summer 2027 Software Engineering Intern").trim(),
        settings: {
          create: {
            dailyTargetMinutes: 180,
            weeklyTargetHours: 21,
            timezone: "America/Chicago",
            theme: "dark",
            autoReportDelivery: false,
            autoReportFrequency: "daily",
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        university: true,
        visaStatus: true,
        targetRole: true,
        createdAt: true,
      },
    });

    // 5. Create token and set HTTP-only cookie
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user,
      },
      { status: 201 }
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
