import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import curriculumData from "@/data/curriculum_180_days.json";

function formatTime12h(date: Date): string {
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  return `${hStr}:${mStr} ${ampm}`;
}

function buildDaySessions(
  rawSessions: any[] = [],
  tasks: any[] = [],
  dayDateStr: string = "2026-10-14",
  actualMinutes: number = 0,
  dayNumber: number = 1,
  anchorProblem: string | null = null,
  dayStatus: string = "Not Started",
  anchorPattern: string | null = null,
  anchorDifficulty: string | null = null
) {
  // 1. If real study sessions exist in database, return them formatted
  if (rawSessions && rawSessions.length > 0) {
    return rawSessions.map((s: any, idx: number) => {
      const sStart = new Date(s.startTime);
      const activeSec = s.activeSeconds || s.elapsedSeconds || 60;
      const sEnd = s.endTime
        ? new Date(s.endTime)
        : new Date(sStart.getTime() + activeSec * 1000);
      const durationMin = Math.max(1, Math.round(activeSec / 60));
      const matchedTask = tasks.find((t: any) => t.id === s.scheduledTaskId);
      const taskTitle = matchedTask ? matchedTask.title : (s.notes || `Study Session ${idx + 1}`);
      const startFmt = formatTime12h(sStart);
      const endFmt = formatTime12h(sEnd);

      return {
        id: s.id,
        sessionIndex: idx + 1,
        startTime: sStart.toISOString(),
        endTime: sEnd.toISOString(),
        displayTimeRange: `${startFmt} – ${endFmt}`,
        startTimeFormatted: startFmt,
        endTimeFormatted: endFmt,
        durationMinutes: durationMin,
        durationHours: Number((durationMin / 60).toFixed(1)),
        logSummary: `Started at ${startFmt} and stopped at ${endFmt} (${durationMin} min spent)`,
        taskTitle,
        category: matchedTask?.category || (s.isManual ? "Study Checklist" : "Focus Timer"),
        status: s.status || "Completed",
        notes: s.notes || (s.isManual ? "Manual checklist log" : "Audited focus session"),
        isManual: !!s.isManual,
        problemPart: anchorProblem || taskTitle,
        problemPattern: anchorPattern || null,
        problemDifficulty: anchorDifficulty || "Medium",
      };
    });
  }

  // 2. Strict policy: NO dummy / fake session data!
  // If no time was logged (actualMinutes <= 0), return an empty session list.
  if (!actualMinutes || actualMinutes <= 0) {
    return [];
  }

  // 3. Fallback for legacy tasks where minutes were logged before studySession table linkage:
  // Only generate blocks for tasks that strictly have actualMinutes > 0, matching their exact duration.
  const activeTasks = tasks.filter((t: any) => (t.actualMinutes || 0) > 0);
  if (activeTasks.length === 0) {
    return [];
  }

  const baseDate = dayDateStr || "2026-10-14";
  let runningTime = new Date(`${baseDate}T09:00:00`);

  return activeTasks.map((t: any, idx: number) => {
    const durationMin = Number(t.actualMinutes);
    const sStart = new Date(runningTime);
    const sEnd = new Date(sStart.getTime() + durationMin * 60 * 1000);
    runningTime = new Date(sEnd.getTime() + 15 * 60 * 1000); // 15m gap

    const startFmt = formatTime12h(sStart);
    const endFmt = formatTime12h(sEnd);

    return {
      id: `task-session-${dayNumber}-${t.id || idx}`,
      sessionIndex: idx + 1,
      startTime: sStart.toISOString(),
      endTime: sEnd.toISOString(),
      displayTimeRange: `${startFmt} – ${endFmt}`,
      startTimeFormatted: startFmt,
      endTimeFormatted: endFmt,
      durationMinutes: durationMin,
      durationHours: Number((durationMin / 60).toFixed(1)),
      logSummary: `Started at ${startFmt} and stopped at ${endFmt} (${durationMin} min spent)`,
      taskTitle: t.title,
      category: t.category || "Study Task",
      status: t.status === "Completed" ? "Completed" : "Logged",
      notes: `Recorded study time: ${durationMin}m on ${t.title}`,
      isManual: true,
      problemPart: anchorProblem || t.title,
      problemPattern: anchorPattern || null,
      problemDifficulty: anchorDifficulty || "Medium",
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    // 1. Candidate Profile (Safe Public Data Only)
    let student = {
      name: "Barun Chhetri",
      university: "University of North Texas (UNT)",
      targetRole: "Summer 2027 Software Engineering Intern",
      visaStatus: "F-1 (OPT / STEM-OPT Eligible)",
      programTitle: "180-Day Software Engineering Interview Preparation Handbook",
      startDate: "2026-10-14",
      endDate: "2027-04-11",
      totalDays: 180,
      dailyTargetHours: 3.0,
      weeklyTargetHours: 21.0,
      totalPlannedHours: 540,
    };

    try {
      const user = await prisma.user.findFirst({
        select: {
          name: true,
          university: true,
          targetRole: true,
          visaStatus: true,
        },
      });
      if (user) {
        if (user.name) student.name = user.name;
        if (user.university) student.university = user.university;
        if (user.targetRole) student.targetRole = user.targetRole;
        if (user.visaStatus) student.visaStatus = user.visaStatus;
      }
    } catch (err) {
      // Non-blocking fallback to default profile
    }

    // 2. Fetch study days with tasks and sessions
    let dbDays: any[] = [];
    try {
      dbDays = await prisma.studyDay.findMany({
        orderBy: { dayNumber: "asc" },
        include: {
          tasks: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              title: true,
              category: true,
              plannedMinutes: true,
              actualMinutes: true,
              status: true,
              isAnchor: true,
              isCarriedForward: true,
            },
          },
          sessions: {
            orderBy: { startTime: "asc" },
            select: {
              id: true,
              startTime: true,
              endTime: true,
              elapsedSeconds: true,
              activeSeconds: true,
              status: true,
              notes: true,
              isManual: true,
              scheduledTaskId: true,
            },
          },
        },
      });
    } catch (err) {
      // Prisma offline or unseeded
      dbDays = [];
    }

    // Map curriculum 180 days with DB state if present
    const staticDays: any[] = curriculumData.days || [];
    const dbDayMap = new Map<number, any>();
    for (const d of dbDays) {
      dbDayMap.set(d.dayNumber, d);
    }

    const mergedDays = staticDays.map((sDay) => {
      const dbMatch = dbDayMap.get(sDay.dayNumber);
      if (dbMatch) {
        return {
          id: dbMatch.id,
          dayNumber: sDay.dayNumber,
          weekNumber: sDay.weekNumber,
          date: sDay.date,
          dayOfWeek: sDay.dayOfWeek,
          displayDate: sDay.displayDate,
          phase: sDay.phase,
          topic: sDay.topic,
          learningObjective: sDay.learningObjective,
          anchorProblem: sDay.anchorProblem || dbMatch.anchorProblem,
          anchorDifficulty: sDay.anchorDifficulty || dbMatch.anchorDifficulty || "Medium",
          anchorPattern: sDay.anchorPattern || dbMatch.anchorPattern,
          anchorInstructions: sDay.anchorInstructions || dbMatch.anchorInstructions,
          secondaryTask: sDay.secondaryTask || dbMatch.secondaryTask,
          deliverable: sDay.deliverable || dbMatch.deliverable,
          completionCriterion: sDay.completionCriterion || dbMatch.completionCriterion,
          totalPlannedMinutes: dbMatch.totalPlannedMinutes || sDay.totalPlannedMinutes || 180,
          actualMinutes: Math.max(
            dbMatch.actualMinutes || 0,
            (dbMatch.sessions || []).reduce((sum: number, s: any) => {
              const sec = s.activeSeconds || s.elapsedSeconds || 0;
              return sum + (sec >= 15 ? Math.max(1, Math.round(sec / 60)) : Math.round(sec / 60));
            }, 0)
          ),
          status:
            (dbMatch.actualMinutes || 0) > 0 || (dbMatch.sessions || []).length > 0
              ? (dbMatch.status === "Not Started" ? "In Progress" : dbMatch.status)
              : (dbMatch.status || "Not Started"),
          confidenceRating: dbMatch.confidenceRating || 0,
          tasks: (dbMatch.tasks && dbMatch.tasks.length > 0) ? dbMatch.tasks : (sDay.tasks || []),
          rawSessions: dbMatch.sessions || [],
        };
      }

      return {
        id: `static-${sDay.dayNumber}`,
        dayNumber: sDay.dayNumber,
        weekNumber: sDay.weekNumber,
        date: sDay.date,
        dayOfWeek: sDay.dayOfWeek,
        displayDate: sDay.displayDate,
        phase: sDay.phase,
        topic: sDay.topic,
        learningObjective: sDay.learningObjective,
        anchorProblem: sDay.anchorProblem,
        anchorDifficulty: sDay.anchorDifficulty || "Medium",
        anchorPattern: sDay.anchorPattern,
        anchorInstructions: sDay.anchorInstructions,
        secondaryTask: sDay.secondaryTask,
        deliverable: sDay.deliverable,
        completionCriterion: sDay.completionCriterion,
        totalPlannedMinutes: sDay.totalPlannedMinutes || 180,
        actualMinutes: 0,
        status: "Not Started",
        confidenceRating: 0,
        tasks: sDay.tasks || [],
        rawSessions: [],
      };
    });

    // 3. Compute Progress & Problem Solved Metrics
    const totalDays = 180;
    let completedDays = 0;
    let inProgressDays = 0;
    let totalActualMinutes = 0;
    let totalPlannedMinutes = 0;
    let daysMeetingTarget = 0; // days where actualMinutes >= 180 (3 hours)
    let problemsSolvedCount = 0;
    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;

    for (const d of mergedDays) {
      totalActualMinutes += d.actualMinutes || 0;
      totalPlannedMinutes += d.totalPlannedMinutes || 180;

      const isCompleted = d.status === "Completed";
      const isInProgress = d.status === "In Progress" || d.actualMinutes > 0;

      if (isCompleted) {
        completedDays++;
      } else if (isInProgress) {
        inProgressDays++;
      }

      if (d.actualMinutes >= 180) {
        daysMeetingTarget++;
      }

      // Check problem solved status:
      // A problem is considered solved if day is Completed or if an anchor task is Completed,
      // or if actual study time on the problem day was logged and marked Completed.
      const hasSolvedProblem =
        isCompleted ||
        d.tasks.some(
          (t: any) =>
            t.isAnchor && (t.status === "Completed" || t.actualMinutes >= 30)
        );

      if (hasSolvedProblem && d.anchorProblem) {
        problemsSolvedCount++;
        const diff = (d.anchorDifficulty || "Medium").toLowerCase();
        if (diff === "easy") easyCount++;
        else if (diff === "hard") hardCount++;
        else mediumCount++;
      }
    }

    const actualHours = Number((totalActualMinutes / 60).toFixed(1));
    const plannedHours = Number((totalPlannedMinutes / 60).toFixed(1));
    const programProgressPercent = Math.min(100, Math.round((completedDays / totalDays) * 100));
    const consistencyRate =
      completedDays + inProgressDays > 0
        ? Math.round((daysMeetingTarget / (completedDays + inProgressDays)) * 100)
        : 100;

    // 4. Phase Breakdown
    const phaseDefinitions = [
      { id: 1, name: "Java Foundations & Essential DSA", days: "Days 1–30", range: [1, 30] },
      { id: 2, name: "Core Interview Patterns", days: "Days 31–60", range: [31, 60] },
      { id: 3, name: "Advanced Algorithms", days: "Days 61–90", range: [61, 90] },
      { id: 4, name: "CS Fundamentals & System Design", days: "Days 91–120", range: [91, 120] },
      { id: 5, name: "Backend Project & Recruiting", days: "Days 121–150", range: [121, 150] },
      { id: 6, name: "Final Mock Interviews & Readiness", days: "Days 151–180", range: [151, 180] },
    ];

    const phases = phaseDefinitions.map((phase) => {
      const phaseDays = mergedDays.filter(
        (d) => d.dayNumber >= phase.range[0] && d.dayNumber <= phase.range[1]
      );
      const phaseCompletedDays = phaseDays.filter((d) => d.status === "Completed").length;
      const phaseInProgressDays = phaseDays.filter((d) => d.status === "In Progress" || (d.actualMinutes > 0 && d.status !== "Completed")).length;
      const phaseActualMinutes = phaseDays.reduce((acc, d) => acc + (d.actualMinutes || 0), 0);
      const phaseProblemsSolved = phaseDays.filter(
        (d) =>
          d.anchorProblem &&
          (d.status === "Completed" ||
            d.tasks.some(
              (t: any) =>
                t.isAnchor && (t.status === "Completed" || t.actualMinutes >= 30)
            ))
      ).length;

      return {
        ...phase,
        totalDays: 30,
        completedDays: phaseCompletedDays,
        inProgressDays: phaseInProgressDays,
        actualMinutes: phaseActualMinutes,
        actualHours: Number((phaseActualMinutes / 60).toFixed(1)),
        plannedHours: 90, // 30 days * 3h = 90h
        problemsSolved: phaseProblemsSolved,
        percent: Math.round((phaseCompletedDays / 30) * 100),
      };
    });

    // 5. Build sanitized daily log records for public display
    const dailyLogs = mergedDays.map((d) => {
      const completedTaskCount = d.tasks.filter((t: any) => t.status === "Completed").length;
      const isTargetMet = d.actualMinutes >= 180;
      const isAnchorSolved =
        d.status === "Completed" ||
        d.tasks.some(
          (t: any) =>
            t.isAnchor && (t.status === "Completed" || t.actualMinutes >= 30)
        );

      return {
        dayNumber: d.dayNumber,
        weekNumber: d.weekNumber,
        date: d.date,
        dayOfWeek: d.dayOfWeek,
        displayDate: d.displayDate,
        phase: d.phase,
        topic: d.topic,
        learningObjective: d.learningObjective,
        anchorProblem: d.anchorProblem,
        anchorDifficulty: d.anchorDifficulty || "Medium",
        anchorPattern: d.anchorPattern,
        anchorInstructions: d.anchorInstructions,
        secondaryTask: d.secondaryTask,
        deliverable: d.deliverable,
        completionCriterion: d.completionCriterion,
        actualMinutes: d.actualMinutes,
        actualHours: Number((d.actualMinutes / 60).toFixed(1)),
        totalPlannedMinutes: d.totalPlannedMinutes,
        plannedHours: Number((d.totalPlannedMinutes / 60).toFixed(1)),
        status: d.status,
        isTargetMet,
        isAnchorSolved,
        confidenceRating: d.confidenceRating,
        totalTasksCount: d.tasks.length,
        completedTasksCount: completedTaskCount,
        tasks: d.tasks.map((t: any) => ({
          title: t.title,
          category: t.category,
          plannedMinutes: t.plannedMinutes,
          actualMinutes: t.actualMinutes || 0,
          status: t.status || "Not Started",
          isAnchor: !!t.isAnchor,
        })),
        sessions: buildDaySessions(
          d.rawSessions,
          d.tasks,
          d.date,
          d.actualMinutes,
          d.dayNumber,
          d.anchorProblem,
          d.status,
          d.anchorPattern,
          d.anchorDifficulty
        ),
      };
    });

    return NextResponse.json({
      success: true,
      student,
      stats: {
        totalDays,
        completedDays,
        inProgressDays,
        actualMinutes: totalActualMinutes,
        actualHours,
        plannedMinutes: totalPlannedMinutes,
        plannedHours: 540,
        programProgressPercent,
        daysMeetingTarget,
        consistencyRate,
        problemsSolvedCount,
        easyProblemsCount: easyCount,
        mediumProblemsCount: mediumCount,
        hardProblemsCount: hardCount,
        totalAnchorProblems: 180,
      },
      phases,
      days: dailyLogs,
    });
  } catch (error) {
    console.error("GET /api/public/progress error:", error);
    return NextResponse.json(
      { error: "Failed to generate public progress feed" },
      { status: 500 }
    );
  }
}
