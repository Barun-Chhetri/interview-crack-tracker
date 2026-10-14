import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalDays = await prisma.studyDay.count();
    const completedDays = await prisma.studyDay.count({
      where: { status: "Completed" },
    });
    const inProgressDays = await prisma.studyDay.count({
      where: { status: "In Progress" },
    });

    const totalTasks = await prisma.scheduledTask.count();
    const completedTasks = await prisma.scheduledTask.count({
      where: { status: "Completed" },
    });

    const totalReviews = await prisma.spacedReview.count();
    const completedReviews = await prisma.spacedReview.count({
      where: { status: "Completed" },
    });

    const aggregateMinutes = await prisma.studyDay.aggregate({
      _sum: {
        totalPlannedMinutes: true,
        actualMinutes: true,
      },
    });

    const plannedMinutes = aggregateMinutes._sum.totalPlannedMinutes || 0;
    const actualMinutes = aggregateMinutes._sum.actualMinutes || 0;

    // Phases count
    const phases = [
      { name: "Java Foundations & Essential DSA", days: "Days 1–30", range: [1, 30] },
      { name: "Core Interview Patterns", days: "Days 31–60", range: [31, 60] },
      { name: "Advanced Algorithms", days: "Days 61–90", range: [61, 90] },
      { name: "CS Fundamentals & System Design", days: "Days 91–120", range: [91, 120] },
      { name: "Backend Project & Recruiting", days: "Days 121–150", range: [121, 150] },
      { name: "Final Mock Interviews & Readiness", days: "Days 151–180", range: [151, 180] },
    ];

    const phasesWithStats = await Promise.all(
      phases.map(async (p) => {
        const count = await prisma.studyDay.count({
          where: {
            dayNumber: { gte: p.range[0], lte: p.range[1] },
            status: "Completed",
          },
        });
        return {
          ...p,
          completedDays: count,
          totalDays: 30,
          percent: Math.round((count / 30) * 100),
        };
      })
    );

    return NextResponse.json({
      totalDays,
      completedDays,
      inProgressDays,
      totalTasks,
      completedTasks,
      totalReviews,
      completedReviews,
      plannedMinutes,
      actualMinutes,
      plannedHours: Number((plannedMinutes / 60).toFixed(1)),
      actualHours: Number((actualMinutes / 60).toFixed(1)),
      programProgressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      phases: phasesWithStats,
    });
  } catch (error) {
    console.error("GET /api/curriculum error:", error);
    return NextResponse.json({ error: "Failed to fetch curriculum overview" }, { status: 500 });
  }
}
