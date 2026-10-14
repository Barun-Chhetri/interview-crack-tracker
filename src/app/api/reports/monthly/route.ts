import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthNumber = Math.min(6, Math.max(1, Number(searchParams.get("month") || "1")));

    const startDay = (monthNumber - 1) * 30 + 1;
    const endDay = monthNumber * 30;

    const days = await prisma.studyDay.findMany({
      where: {
        dayNumber: { gte: startDay, lte: endDay },
      },
      orderBy: { dayNumber: "asc" },
      include: {
        tasks: true,
      },
    });

    if (days.length === 0) {
      return NextResponse.json({ error: "Month data not found" }, { status: 404 });
    }

    const startDate = days[0].date;
    const endDate = days[days.length - 1].date;
    const phaseName = days[0].phase;

    const totalPlannedMinutes = days.reduce((sum, d) => sum + d.totalPlannedMinutes, 0);
    const totalActualMinutes = days.reduce((sum, d) => sum + d.actualMinutes, 0);

    const allTasks = days.flatMap((d) => d.tasks);
    const completedTasks = allTasks.filter((t) => t.status === "Completed");

    const curriculumProgress = Math.round((completedTasks.length / allTasks.length) * 100);

    const daysMeetingTarget = days.filter((d) => d.actualMinutes >= 180).length;
    const consistencyRate = Math.round((daysMeetingTarget / 30) * 100);

    const assessmentDay = days[days.length - 1]; // Day 30, 60, 90, 120, 150, 180

    const prioritiesByMonth: Record<number, string[]> = {
      1: ["Master HashMap/HashSet and two pointers", "Java collections equals/hashCode deep dive", "Clean LeetCode template setup"],
      2: ["Trees, backtracking, and heaps fluency", "First timed mock round", "STAR behavioral story outlines"],
      3: ["Graph traversal (BFS/DFS, Topological)", "Dynamic programming memoization & tabulation", "Timed 3-problem mixed sets"],
      4: ["Campus Task Tracker API architecture", "OOP/LLD patterns and database indexing", "F-1 CPT compliance verification"],
      5: ["Backend API integration with Spring Boot & PostgreSQL", "Resume polish for Summer 2027 openings", "Behavioral interview delivery"],
      6: ["Full 45-minute cold mock interviews", "Weakest topic surgical review", "Final application rounds"],
    };

    return NextResponse.json({
      monthNumber,
      phaseName,
      startDate,
      endDate,
      startDay,
      endDay,
      plannedHours: Number((totalPlannedMinutes / 60).toFixed(1)),
      actualHours: Number((totalActualMinutes / 60).toFixed(1)),
      curriculumProgress,
      consistencyRate,
      daysMeetingTarget,
      assessmentTopic: assessmentDay.topic,
      assessmentResult: assessmentDay.status === "Completed" ? "Completed with Passing Score" : "Upcoming Assessment",
      dsaPatternMastery: `${completedTasks.filter((t) => t.category.includes("LeetCode") || t.category.includes("DSA")).length} patterns practiced`,
      readinessTrends: consistencyRate >= 70 ? "On Track for Top Tier Internships" : "Pacing Steady, Ramp Up Timed Sets",
      projectProgress: monthNumber >= 4 ? "Campus Task Tracker API In Progress" : "Java Fundamentals Phase",
      recruitingActivity: "Tracking Summer 2027 opening windows and UNT career fairs",
      topPrioritiesNextMonth: prioritiesByMonth[monthNumber] || prioritiesByMonth[1],
    });
  } catch (error) {
    console.error("GET /api/reports/monthly error:", error);
    return NextResponse.json({ error: "Failed to generate monthly report" }, { status: 500 });
  }
}
