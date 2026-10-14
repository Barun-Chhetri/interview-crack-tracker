import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      include: {
        settings: true,
        recipients: true,
      },
    });

    const program = await prisma.program.findFirst();

    const days = await prisma.studyDay.findMany({
      orderBy: { dayNumber: "asc" },
      include: {
        tasks: {
          orderBy: { orderIndex: "asc" },
        },
        reviewsDue: true,
        sessions: true,
      },
    });

    const carryovers = await prisma.carryoverRecord.findMany({
      orderBy: { createdAt: "desc" },
    });

    const exportData = {
      exportTimestamp: new Date().toISOString(),
      user: {
        name: user?.name,
        email: user?.email,
        university: user?.university,
        visaStatus: user?.visaStatus,
        targetRole: user?.targetRole,
      },
      program,
      days,
      carryovers,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="interview_tracker_export_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("GET /api/export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
