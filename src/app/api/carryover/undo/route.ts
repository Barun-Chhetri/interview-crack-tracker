import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { carryoverRecordId } = body;

    if (!carryoverRecordId) {
      return NextResponse.json({ error: "carryoverRecordId required" }, { status: 400 });
    }

    const record = await prisma.carryoverRecord.findUnique({
      where: { id: carryoverRecordId },
      include: {
        sourceTask: true,
        targetTask: true,
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Carryover record not found" }, { status: 404 });
    }

    if (record.status === "Undone") {
      return NextResponse.json({ error: "This carryover has already been undone" }, { status: 400 });
    }

    // Check if target task has already been started or completed
    if (record.targetTask && (record.targetTask.status === "Completed" || record.targetTask.actualMinutes > 0)) {
      return NextResponse.json(
        {
          error: "Cannot undo carryover: the carried task has already been worked on or completed on the target day.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete target task if it exists
      if (record.targetTaskId) {
        await tx.scheduledTask.delete({
          where: { id: record.targetTaskId },
        });

        // Recalculate target day total planned minutes
        const targetDay = await tx.studyDay.findFirst({
          where: { date: record.toDate },
        });
        if (targetDay) {
          const remainingTasks = await tx.scheduledTask.findMany({
            where: { studyDayId: targetDay.id },
          });
          const newPlanned = remainingTasks.reduce((sum, t) => sum + t.plannedMinutes, 0);
          await tx.studyDay.update({
            where: { id: targetDay.id },
            data: { totalPlannedMinutes: newPlanned },
          });
        }
      }

      // 2. Restore source task
      if (record.sourceTask) {
        const restoredRemaining = Math.max(0, record.sourceTask.plannedMinutes - record.sourceTask.actualMinutes);
        const restoredStatus =
          record.sourceTask.actualMinutes > 0
            ? "Partially Completed"
            : "Not Started";

        await tx.scheduledTask.update({
          where: { id: record.sourceTaskId },
          data: {
            remainingMinutes: restoredRemaining,
            status: restoredStatus,
          },
        });
      }

      // 3. Mark record as Undone
      await tx.carryoverRecord.update({
        where: { id: record.id },
        data: { status: "Undone" },
      });
    });

    return NextResponse.json({ success: true, message: "Carryover undone successfully" });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to undo carryover";
    console.error("POST /api/carryover/undo error:", error);
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
