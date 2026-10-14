import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dayNumber = searchParams.get("dayNumber");
    const date = searchParams.get("date");

    if (!dayNumber && !date) {
      return NextResponse.json({ error: "dayNumber or date required" }, { status: 400 });
    }

    const studyDay = await prisma.studyDay.findFirst({
      where: dayNumber ? { dayNumber: Number(dayNumber) } : { date: date! },
      include: {
        tasks: {
          orderBy: { orderIndex: "asc" },
        },
        reviewsDue: true,
        sessions: true,
        dailyReport: true,
      },
    });

    if (!studyDay) {
      return NextResponse.json({ error: "Study day not found" }, { status: 404 });
    }

    // Tomorrow's day for priorities
    const nextDay = await prisma.studyDay.findUnique({
      where: { dayNumber: Math.min(180, studyDay.dayNumber + 1) },
      include: { tasks: true },
    });

    // Derive actual statistics from real saved data
    const completedTasks = studyDay.tasks.filter((t) => t.status === "Completed");
    const partialTasks = studyDay.tasks.filter((t) => t.status === "Partially Completed");
    const carriedTasks = studyDay.tasks.filter((t) => t.status === "Carried Forward");
    const missedTasks = studyDay.tasks.filter((t) => t.status === "Missed");

    // Independent solves: completed anchor problems where notes don't indicate hints needed
    const anchorTasks = completedTasks.filter((t) => t.isAnchor);
    const independentSolves = anchorTasks.filter((t) => !t.notes?.toLowerCase().includes("hint")).length;
    const neededHints = anchorTasks.filter((t) => t.notes?.toLowerCase().includes("hint")).length;

    // Topics reviewed
    const reviewedReviews = studyDay.reviewsDue.filter((r) => r.status === "Completed");
    const topicsReviewed = [
      studyDay.topic,
      ...reviewedReviews.map((r) => `${r.anchorTitle} (${r.intervalName})`),
    ].join(", ");

    // Tomorrow priorities
    const tomorrowPriorities = nextDay?.tasks
      .slice(0, 3)
      .map((t) => t.title)
      .join("; ") || "Consolidate and review previous patterns";

    const reportData = {
      date: studyDay.date,
      dayNumber: studyDay.dayNumber,
      displayDate: studyDay.displayDate,
      plannedMinutes: studyDay.totalPlannedMinutes,
      actualMinutes: studyDay.actualMinutes,
      plannedHours: Number((studyDay.totalPlannedMinutes / 60).toFixed(2)),
      actualHours: Number((studyDay.actualMinutes / 60).toFixed(2)),
      metDailyTarget: studyDay.actualMinutes >= 180,
      completedTasksCount: completedTasks.length,
      partialTasksCount: partialTasks.length,
      carriedTasksCount: carriedTasks.length,
      missedTasksCount: missedTasks.length,
      totalTasksCount: studyDay.tasks.length,
      tasks: studyDay.tasks.map((t) => ({
        title: t.title,
        status: t.status,
        plannedMinutes: t.plannedMinutes,
        actualMinutes: t.actualMinutes,
        remainingMinutes: t.remainingMinutes,
      })),
      independentSolves,
      neededHints,
      fullSolution: 0,
      topicsReviewed,
      mistakesDiscovered: studyDay.notes || "No major blockers recorded. Invariant maintained.",
      confidenceRating: studyDay.confidenceRating || 4,
      tomorrowPriorities,
      existingReportId: studyDay.dailyReport?.id || null,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("GET /api/reports/daily error:", error);
    return NextResponse.json({ error: "Failed to generate daily report" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      dayNumber,
      date,
      topicsReviewed,
      mistakesDiscovered,
      confidenceRating,
      tomorrowPriorities,
      independentSolves,
      neededHints,
    } = body;

    const studyDay = await prisma.studyDay.findFirst({
      where: dayNumber ? { dayNumber: Number(dayNumber) } : { date },
      include: { tasks: true },
    });

    if (!studyDay) {
      return NextResponse.json({ error: "Study day not found" }, { status: 404 });
    }

    const completedCount = studyDay.tasks.filter((t) => t.status === "Completed").length;
    const partialCount = studyDay.tasks.filter((t) => t.status === "Partially Completed").length;
    const carriedCount = studyDay.tasks.filter((t) => t.status === "Carried Forward").length;
    const missedCount = studyDay.tasks.filter((t) => t.status === "Missed").length;

    const report = await prisma.dailyReport.upsert({
      where: { studyDayId: studyDay.id },
      update: {
        plannedMinutes: studyDay.totalPlannedMinutes,
        actualMinutes: studyDay.actualMinutes,
        completedTasksCount: completedCount,
        partialTasksCount: partialCount,
        carriedTasksCount: carriedCount,
        missedTasksCount: missedCount,
        independentSolves: independentSolves !== undefined ? Number(independentSolves) : 1,
        neededHints: neededHints !== undefined ? Number(neededHints) : 0,
        topicsReviewed: topicsReviewed || studyDay.topic,
        mistakesDiscovered: mistakesDiscovered || studyDay.notes,
        confidenceRating: confidenceRating !== undefined ? Number(confidenceRating) : 4,
        tomorrowPriorities: tomorrowPriorities || "Next day core curriculum",
      },
      create: {
        studyDayId: studyDay.id,
        date: studyDay.date,
        dayNumber: studyDay.dayNumber,
        plannedMinutes: studyDay.totalPlannedMinutes,
        actualMinutes: studyDay.actualMinutes,
        completedTasksCount: completedCount,
        partialTasksCount: partialCount,
        carriedTasksCount: carriedCount,
        missedTasksCount: missedCount,
        independentSolves: independentSolves !== undefined ? Number(independentSolves) : 1,
        neededHints: neededHints !== undefined ? Number(neededHints) : 0,
        topicsReviewed: topicsReviewed || studyDay.topic,
        mistakesDiscovered: mistakesDiscovered || studyDay.notes,
        confidenceRating: confidenceRating !== undefined ? Number(confidenceRating) : 4,
        tomorrowPriorities: tomorrowPriorities || "Next day core curriculum",
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("POST /api/reports/daily error:", error);
    return NextResponse.json({ error: "Failed to save daily report" }, { status: 500 });
  }
}
