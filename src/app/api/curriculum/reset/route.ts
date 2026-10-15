import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Reset all study days to 0 actual minutes and Not Started
      await tx.studyDay.updateMany({
        data: {
          actualMinutes: 0,
          status: "Not Started",
          confidenceRating: 0,
          notes: null,
        },
      });

      // 2. Reset tasks: actualMinutes = 0, status = Not Started, notes = null, clean carryover flags
      const tasks = await tx.scheduledTask.findMany({
        select: { id: true, plannedMinutes: true },
      });

      for (const t of tasks) {
        await tx.scheduledTask.update({
          where: { id: t.id },
          data: {
            actualMinutes: 0,
            remainingMinutes: t.plannedMinutes,
            status: "Not Started",
            notes: null,
            isCarriedForward: false,
            carryoverCount: 0,
          },
        });
      }

      // 3. Clear study sessions and carryover records
      await tx.studySession.deleteMany({});
      await tx.carryoverRecord.deleteMany({});

      // 4. Clear generated reports
      await tx.reportDelivery.deleteMany({});
      await tx.dailyReport.deleteMany({});
      await tx.weeklyReport.deleteMany({});
      await tx.monthlyReport.deleteMany({});

      // 5. Remove synthetic repair reviews and reset existing spaced reviews to Pending
      await tx.spacedReview.deleteMany({
        where: { intervalName: "Repair" },
      });

      await tx.spacedReview.updateMany({
        data: {
          status: "Pending",
          result: null,
          completionDate: null,
          notes: null,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Curriculum study progress successfully reset to Day 1 (0 minutes)",
    });
  } catch (error) {
    console.error("POST /api/curriculum/reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset curriculum progress" },
      { status: 500 }
    );
  }
}
