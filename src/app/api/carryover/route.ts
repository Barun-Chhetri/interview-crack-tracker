import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateWorkload } from "@/lib/calculations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dayNumber = searchParams.get("dayNumber");
    const historyOnly = searchParams.get("history") === "true";

    if (historyOnly) {
      const records = await prisma.carryoverRecord.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          sourceTask: {
            select: {
              title: true,
              category: true,
              originalDate: true,
            },
          },
          targetTask: {
            select: {
              id: true,
              status: true,
              actualMinutes: true,
            },
          },
        },
      });

      return NextResponse.json(records);
    }

    if (!dayNumber) {
      return NextResponse.json({ error: "dayNumber required" }, { status: 400 });
    }

    const currentDay = await prisma.studyDay.findUnique({
      where: { dayNumber: Number(dayNumber) },
      include: {
        tasks: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!currentDay) {
      return NextResponse.json({ error: "Current day not found" }, { status: 404 });
    }

    // Tomorrow is currentDay.dayNumber + 1 (up to 180)
    const nextDayNumber = Math.min(180, currentDay.dayNumber + 1);
    const nextDay = await prisma.studyDay.findUnique({
      where: { dayNumber: nextDayNumber },
      include: {
        tasks: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    // Unfinished tasks are tasks with remainingMinutes > 0 and status != 'Completed'
    const unfinishedTasks = currentDay.tasks.filter(
      (t) => t.status !== "Completed" && Math.max(0, t.plannedMinutes - t.actualMinutes) > 0
    );

    const totalUnfinishedMinutes = unfinishedTasks.reduce(
      (sum, t) => sum + Math.max(0, t.plannedMinutes - t.actualMinutes),
      0
    );

    const nextDayOriginalMinutes = nextDay?.totalPlannedMinutes || 180;
    const workloadEval = evaluateWorkload(nextDayOriginalMinutes, totalUnfinishedMinutes);

    return NextResponse.json({
      currentDay: {
        dayNumber: currentDay.dayNumber,
        date: currentDay.date,
        displayDate: currentDay.displayDate,
      },
      nextDay: nextDay
        ? {
            dayNumber: nextDay.dayNumber,
            date: nextDay.date,
            displayDate: nextDay.displayDate,
            originalPlannedMinutes: nextDay.totalPlannedMinutes,
          }
        : null,
      unfinishedTasks: unfinishedTasks.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        plannedMinutes: t.plannedMinutes,
        actualMinutes: t.actualMinutes,
        remainingMinutes: Math.max(0, t.plannedMinutes - t.actualMinutes),
        priority: t.priority,
        status: t.status,
      })),
      totalUnfinishedMinutes,
      workloadEvaluation: workloadEval,
    });
  } catch (error) {
    console.error("GET /api/carryover error:", error);
    return NextResponse.json({ error: "Failed to calculate carryover proposal" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      taskIds,
      sourceDayNumber,
      targetDayNumber,
      targetDate,
      reason,
    } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: "taskIds array required" }, { status: 400 });
    }

    // Determine target day
    let targetDay;
    if (targetDayNumber) {
      targetDay = await prisma.studyDay.findUnique({
        where: { dayNumber: Number(targetDayNumber) },
      });
    } else if (targetDate) {
      targetDay = await prisma.studyDay.findFirst({
        where: { date: targetDate },
      });
    } else if (sourceDayNumber) {
      targetDay = await prisma.studyDay.findUnique({
        where: { dayNumber: Number(sourceDayNumber) + 1 },
      });
    }

    if (!targetDay) {
      return NextResponse.json({ error: "Target study day not found" }, { status: 404 });
    }

    // Run carryover in a database transaction to prevent inconsistencies or duplicates
    const result = await prisma.$transaction(async (tx) => {
      const createdCarryovers = [];

      for (const taskId of taskIds) {
        const sourceTask = await tx.scheduledTask.findUnique({
          where: { id: taskId },
        });

        if (!sourceTask) continue;

        // Prevent accidental duplicate active carryover from same task to same target
        const existingActiveCarry = await tx.carryoverRecord.findFirst({
          where: {
            sourceTaskId: sourceTask.id,
            toDate: targetDay.date,
            status: "Active",
          },
        });

        if (existingActiveCarry) {
          throw new Error(`Task "${sourceTask.title}" has already been carried forward to ${targetDay.date}.`);
        }

        const remainingMinutes = Math.max(0, sourceTask.plannedMinutes - sourceTask.actualMinutes);
        if (remainingMinutes <= 0) continue;

        // 1. Create target task on target day
        const targetTask = await tx.scheduledTask.create({
          data: {
            studyDayId: targetDay.id,
            title: `[Carried] ${sourceTask.title}`,
            instruction: sourceTask.instruction,
            category: sourceTask.category,
            plannedMinutes: remainingMinutes,
            actualMinutes: 0,
            remainingMinutes: remainingMinutes,
            priority: sourceTask.priority,
            status: "Not Started",
            notes: `Carried forward from Day ${sourceDayNumber || sourceTask.originalDate}. Original date: ${sourceTask.originalDate}`,
            resourceUrl: sourceTask.resourceUrl,
            originalDate: sourceTask.originalDate,
            currentDate: targetDay.date,
            isAnchor: sourceTask.isAnchor,
            isCarriedForward: true,
            sourceTaskId: sourceTask.id,
            carryoverCount: sourceTask.carryoverCount + 1,
            orderIndex: 99, // place at end or top
          },
        });

        // 2. Update source task status
        // If some time was spent, status is "Partially Completed"; if 0 time spent, "Carried Forward"
        const sourceStatus = sourceTask.actualMinutes > 0 ? "Partially Completed" : "Carried Forward";
        await tx.scheduledTask.update({
          where: { id: sourceTask.id },
          data: {
            status: sourceStatus,
            remainingMinutes: 0, // Transferred
          },
        });

        // 3. Create CarryoverRecord
        const carryRecord = await tx.carryoverRecord.create({
          data: {
            sourceTaskId: sourceTask.id,
            targetTaskId: targetTask.id,
            fromDate: sourceTask.currentDate,
            toDate: targetDay.date,
            originalMinutes: sourceTask.plannedMinutes,
            carriedMinutes: remainingMinutes,
            status: "Active",
            reason: reason || "Carried unfinished work to tomorrow",
          },
        });

        createdCarryovers.push(carryRecord);
      }

      // Update target day's total planned minutes
      const allTargetTasks = await tx.scheduledTask.findMany({
        where: { studyDayId: targetDay.id },
      });
      const newTargetPlanned = allTargetTasks.reduce((sum, t) => sum + t.plannedMinutes, 0);

      await tx.studyDay.update({
        where: { id: targetDay.id },
        data: {
          totalPlannedMinutes: newTargetPlanned,
        },
      });

      return {
        transferredCount: createdCarryovers.length,
        targetDay: {
          dayNumber: targetDay.dayNumber,
          date: targetDay.date,
          newPlannedMinutes: newTargetPlanned,
        },
        records: createdCarryovers,
      };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Carryover failed";
    console.error("POST /api/carryover error:", error);
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
