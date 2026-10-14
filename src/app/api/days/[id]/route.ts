import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const day = await prisma.studyDay.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { orderIndex: "asc" },
        },
        reviewsDue: true,
        sessions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!day) {
      return NextResponse.json({ error: "Study day not found" }, { status: 404 });
    }

    return NextResponse.json(day);
  } catch (error) {
    console.error("GET /api/days/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch day" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { notes, confidenceRating, status } = body;

    const updated = await prisma.studyDay.update({
      where: { id },
      data: {
        ...(notes !== undefined ? { notes } : {}),
        ...(confidenceRating !== undefined ? { confidenceRating: Number(confidenceRating) } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      include: {
        tasks: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/days/[id] error:", error);
    return NextResponse.json({ error: "Failed to update study day" }, { status: 500 });
  }
}
