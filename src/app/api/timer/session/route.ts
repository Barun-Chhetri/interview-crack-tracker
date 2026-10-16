import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scheduledTaskId,
      studyDayId,
      startTime,
      endTime,
      elapsedSeconds,
      activeSeconds,
      pausedSeconds,
      notes,
      isManual,
      auditLog,
    } = body;

    const activeSec = Number(activeSeconds || elapsedSeconds || 0);
    const activeMin = activeSec >= 15 ? Math.max(1, Math.round(activeSec / 60)) : Math.round(activeSec / 60);

    // Create session record
    const sEnd = endTime ? new Date(endTime) : new Date();
    const sStart = startTime ? new Date(startTime) : new Date(sEnd.getTime() - activeSec * 1000);

    const session = await prisma.studySession.create({
      data: {
        scheduledTaskId: scheduledTaskId || null,
        studyDayId: studyDayId || null,
        startTime: sStart,
        endTime: sEnd,
        elapsedSeconds: Number(elapsedSeconds || activeSec),
        activeSeconds: activeSec,
        pausedSeconds: Number(pausedSeconds || 0),
        status: "completed",
        notes: notes || null,
        isManual: Boolean(isManual),
        auditLog: auditLog || (isManual ? "Manual study session entry" : "Timer study session completed"),
      },
    });

    // If attached to a scheduled task, increment actualMinutes
    if (scheduledTaskId) {
      const task = await prisma.scheduledTask.findUnique({
        where: { id: scheduledTaskId },
      });

      if (task) {
        const newActual = task.actualMinutes + activeMin;
        const newRemaining = Math.max(0, task.plannedMinutes - newActual);
        const newStatus =
          newRemaining === 0
            ? "Completed"
            : newActual > 0
            ? "Partially Completed"
            : task.status;

        await prisma.scheduledTask.update({
          where: { id: scheduledTaskId },
          data: {
            actualMinutes: newActual,
            remainingMinutes: newRemaining,
            status: newStatus,
          },
        });

        // Recalculate parent day
        const siblings = await prisma.scheduledTask.findMany({
          where: { studyDayId: task.studyDayId },
        });

        const dayActual = siblings.reduce((sum, t) => sum + t.actualMinutes, 0);
        const allCompleted = siblings.every((t) => t.status === "Completed");

        await prisma.studyDay.update({
          where: { id: task.studyDayId },
          data: {
            actualMinutes: dayActual,
            status: allCompleted ? "Completed" : "In Progress",
          },
        });
      }
    } else if (studyDayId) {
      // General day session without specific task
      const day = await prisma.studyDay.findUnique({ where: { id: studyDayId } });
      if (day) {
        await prisma.studyDay.update({
          where: { id: studyDayId },
          data: {
            actualMinutes: day.actualMinutes + activeMin,
            status: day.status === "Not Started" ? "In Progress" : day.status,
          },
        });
      }
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("POST /api/timer/session error:", error);
    return NextResponse.json({ error: "Failed to record study session" }, { status: 500 });
  }
}
