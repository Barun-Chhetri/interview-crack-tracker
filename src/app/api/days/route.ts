import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dayNumber = searchParams.get("dayNumber");
    const date = searchParams.get("date");
    const phase = searchParams.get("phase");
    const week = searchParams.get("week");
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;

    if (dayNumber) {
      const day = await prisma.studyDay.findUnique({
        where: { dayNumber: Number(dayNumber) },
        include: {
          tasks: {
            orderBy: { orderIndex: "asc" },
          },
          reviewsDue: true,
          sessions: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });

      if (!day) {
        return NextResponse.json({ error: "Study day not found" }, { status: 404 });
      }

      return NextResponse.json(day);
    }

    if (date) {
      const day = await prisma.studyDay.findFirst({
        where: { date },
        include: {
          tasks: {
            orderBy: { orderIndex: "asc" },
          },
          reviewsDue: true,
        },
      });

      if (!day) {
        return NextResponse.json({ error: "Study day not found" }, { status: 404 });
      }

      return NextResponse.json(day);
    }

    const where: { phase?: string; weekNumber?: number } = {};
    if (phase) where.phase = phase;
    if (week) where.weekNumber = Number(week);

    const days = await prisma.studyDay.findMany({
      where,
      orderBy: { dayNumber: "asc" },
      take: limit,
      skip: offset,
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            category: true,
            plannedMinutes: true,
            actualMinutes: true,
            remainingMinutes: true,
            status: true,
            isAnchor: true,
            isCarriedForward: true,
          },
        },
      },
    });

    const totalCount = await prisma.studyDay.count({ where });

    return NextResponse.json({ days, totalCount });
  } catch (error) {
    console.error("GET /api/days error:", error);
    return NextResponse.json({ error: "Failed to retrieve study days" }, { status: 500 });
  }
}
