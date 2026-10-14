import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fullProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        university: true,
        visaStatus: true,
        targetRole: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
      },
    });

    return NextResponse.json(fullProfile);
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, university, visaStatus, targetRole } = body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(university !== undefined ? { university: university.trim() } : {}),
        ...(visaStatus !== undefined ? { visaStatus: visaStatus.trim() } : {}),
        ...(targetRole !== undefined ? { targetRole: targetRole.trim() } : {}),
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
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/user/profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
