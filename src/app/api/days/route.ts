import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  TEXAS_TIMEZONE,
  getTexasIsoDate,
  getCurriculumDayForTexasDate,
  formatTexasTime12h,
  formatTexasTimeWithZone,
  getTexasTzAbbreviation,
} from "@/lib/texas-time";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dayNumberParam = searchParams.get("dayNumber");
    const date = searchParams.get("date");
    const phase = searchParams.get("phase");
    const week = searchParams.get("week");
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;

    // Handle "today" or numeric dayNumber
    const targetDayNumber =
      dayNumberParam === "today"
        ? getCurriculumDayForTexasDate()
        : dayNumberParam
        ? Number(dayNumberParam)
        : null;

    if (targetDayNumber) {
      const day = await prisma.studyDay.findUnique({
        where: { dayNumber: targetDayNumber },
        include: {
          tasks: {
            orderBy: { orderIndex: "asc" },
          },
          reviewsDue: true,
          sessions: {
            orderBy: { startTime: "asc" },
            take: 25,
          },
        },
      });

      if (!day) {
        return NextResponse.json({ error: "Study day not found" }, { status: 404 });
      }

      // Format sessions in Texas Time for instant audit display
      const formattedSessions = (day.sessions || []).map((s, idx) => {
        const sStart = new Date(s.startTime);
        const sEnd = s.endTime ? new Date(s.endTime) : new Date(sStart.getTime() + (s.activeSeconds || 60) * 1000);
        const startFmt = formatTexasTime12h(sStart);
        const endFmt = formatTexasTime12h(sEnd);
        const durationMin = Math.max(1, Math.round((s.activeSeconds || s.elapsedSeconds || 60) / 60));

        return {
          ...s,
          startTimeFormatted: startFmt,
          endTimeFormatted: endFmt,
          displayTimeRange: `${startFmt} – ${endFmt}`,
          durationMinutes: durationMin,
          timezone: TEXAS_TIMEZONE,
          timezoneAbbr: getTexasTzAbbreviation(sStart),
          logSummary: `Started at ${startFmt} and stopped at ${endFmt} (${durationMin} min spent)`,
        };
      });

      const todayTexasDate = getTexasIsoDate();
      const now = new Date();

      return NextResponse.json({
        ...day,
        sessions: formattedSessions,
        isCurrentTexasToday: day.date === todayTexasDate,
        texasTime: {
          timezone: TEXAS_TIMEZONE,
          timezoneAbbr: getTexasTzAbbreviation(now),
          todayDate: todayTexasDate,
          todayDayNumber: getCurriculumDayForTexasDate(todayTexasDate),
          currentTimeFormatted: formatTexasTimeWithZone(now),
        },
      });
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
    const todayTexasDate = getTexasIsoDate();
    const now = new Date();

    return NextResponse.json({
      days,
      totalCount,
      texasTime: {
        timezone: TEXAS_TIMEZONE,
        timezoneAbbr: getTexasTzAbbreviation(now),
        todayDate: todayTexasDate,
        todayDayNumber: getCurriculumDayForTexasDate(todayTexasDate),
        currentTimeFormatted: formatTexasTimeWithZone(now),
      },
    });
  } catch (error) {
    console.error("GET /api/days error:", error);
    return NextResponse.json({ error: "Failed to retrieve study days" }, { status: 500 });
  }
}
