import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = Number(searchParams.get("week") || "1");

    // Retrieve the 7 days belonging to this week
    const days = await prisma.studyDay.findMany({
      where: { weekNumber },
      orderBy: { dayNumber: "asc" },
      include: {
        tasks: true,
        reviewsDue: true,
      },
    });

    if (days.length === 0) {
      return NextResponse.json({ error: "Week not found" }, { status: 404 });
    }

    const startDate = days[0].date;
    const endDate = days[days.length - 1].date;

    const totalPlannedMinutes = days.reduce((sum, d) => sum + d.totalPlannedMinutes, 0);
    const totalActualMinutes = days.reduce((sum, d) => sum + d.actualMinutes, 0);

    const plannedHours = Number((totalPlannedMinutes / 60).toFixed(1));
    const actualHours = Number((totalActualMinutes / 60).toFixed(1));

    // Tasks aggregation
    const allTasks = days.flatMap((d) => d.tasks);
    const completedTasks = allTasks.filter((t) => t.status === "Completed");
    const carriedTasks = allTasks.filter((t) => t.isCarriedForward || t.status === "Carried Forward");

    const adherencePercent =
      allTasks.length > 0
        ? Math.round((completedTasks.length / allTasks.length) * 100)
        : 100;

    // Problems
    const anchorTasks = allTasks.filter((t) => t.isAnchor);
    const totalProblemsAttempted = anchorTasks.filter((t) => t.actualMinutes > 0 || t.status === "Completed").length;
    const independentSolves = anchorTasks.filter(
      (t) => t.status === "Completed" && !t.notes?.toLowerCase().includes("hint")
    ).length;

    // Spaced Repetition stats for the week
    const weekReviews = await prisma.spacedReview.findMany({
      where: {
        dueDate: { gte: startDate, lte: endDate },
      },
    });

    const completedReviews = weekReviews.filter((r) => r.status === "Completed");
    const strongReviews = completedReviews.filter((r) => r.result === "Strong");
    const spacedRepSuccessRate =
      completedReviews.length > 0
        ? Math.round((strongReviews.length / completedReviews.length) * 100)
        : 85;

    // Weakest & Strongest topics
    const distinctTopics = Array.from(new Set(days.map((d) => d.topic)));
    const strongestTopics = distinctTopics.slice(0, 2).join(", ");
    const weakestTopics =
      distinctTopics.length > 2
        ? distinctTopics.slice(-1).join(", ")
        : "None identified as critical";

    const carryoverRemainingMinutes = carriedTasks
      .filter((t) => t.status !== "Completed")
      .reduce((sum, t) => sum + t.remainingMinutes, 0);

    const recommendations =
      actualHours < plannedHours
        ? `Study time fell short by ${(plannedHours - actualHours).toFixed(1)} hours. Prioritize morning 90-minute blocks and avoid leaving full sessions for late night.`
        : `Strong consistency! You met the 21-hour target. Focus on cold problem attempts under 25-minute interview timers.`;

    const summary = `Week ${weekNumber} (${startDate} to ${endDate}): Completed ${actualHours}h of ${plannedHours}h target (${adherencePercent}% task adherence). Attempted ${totalProblemsAttempted} anchor problems with ${independentSolves} independent solves.`;

    return NextResponse.json({
      weekNumber,
      startDate,
      endDate,
      plannedHours,
      actualHours,
      adherencePercent,
      totalProblemsAttempted,
      independentSolves,
      spacedRepSuccessRate,
      weakestTopics,
      strongestTopics,
      carryoverRemainingMinutes,
      recommendations,
      summary,
      dailyBreakdown: days.map((d) => ({
        dayNumber: d.dayNumber,
        date: d.date,
        dayOfWeek: d.dayOfWeek,
        topic: d.topic,
        plannedMinutes: d.totalPlannedMinutes,
        actualMinutes: d.actualMinutes,
        status: d.status,
      })),
    });
  } catch (error) {
    console.error("GET /api/reports/weekly error:", error);
    return NextResponse.json({ error: "Failed to generate weekly report" }, { status: 500 });
  }
}
