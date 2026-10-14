import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, actualMinutes, plannedMinutes, notes } = body;

    const task = await prisma.scheduledTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const newPlanned = plannedMinutes !== undefined ? Number(plannedMinutes) : task.plannedMinutes;
    let newActual = actualMinutes !== undefined ? Number(actualMinutes) : task.actualMinutes;
    let newStatus = status !== undefined ? status : task.status;

    // If marked Completed, remainingMinutes becomes 0, and if actualMinutes wasn't set, default to plannedMinutes
    let newRemaining = Math.max(0, newPlanned - newActual);
    if (newStatus === "Completed") {
      newRemaining = 0;
      if (newActual === 0) {
        newActual = newPlanned;
      }
    } else if (newStatus === "Partially Completed") {
      newRemaining = Math.max(0, newPlanned - newActual);
    } else if (newStatus === "Not Started") {
      newActual = 0;
      newRemaining = newPlanned;
    }

    const updatedTask = await prisma.scheduledTask.update({
      where: { id },
      data: {
        status: newStatus,
        plannedMinutes: newPlanned,
        actualMinutes: newActual,
        remainingMinutes: newRemaining,
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    // Recalculate parent studyDay totals
    const siblingTasks = await prisma.scheduledTask.findMany({
      where: { studyDayId: task.studyDayId },
    });

    const dayActualMinutes = siblingTasks.reduce((sum, t) => sum + t.actualMinutes, 0);
    const dayPlannedMinutes = siblingTasks.reduce((sum, t) => sum + t.plannedMinutes, 0);

    const allCompleted = siblingTasks.length > 0 && siblingTasks.every((t) => t.status === "Completed");
    const anyActive = siblingTasks.some(
      (t) => t.status === "In Progress" || t.status === "Partially Completed" || t.status === "Completed"
    );

    let dayStatus = "Not Started";
    if (allCompleted) {
      dayStatus = "Completed";
    } else if (anyActive) {
      dayStatus = "In Progress";
    }

    await prisma.studyDay.update({
      where: { id: task.studyDayId },
      data: {
        actualMinutes: dayActualMinutes,
        totalPlannedMinutes: dayPlannedMinutes,
        status: dayStatus,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
