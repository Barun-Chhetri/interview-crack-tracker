import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // 1. Disassociate all study days from any user so curriculum stays completely untouched
    await prisma.studyDay.updateMany({
      data: { userId: null },
    });

    // 2. Delete all user accounts
    // Cascades UserSettings, ReportRecipient, StarStory, ProjectStage, JobApplication, etc.
    const deleted = await prisma.user.deleteMany({});

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count,
      message: `Cleaned ${deleted.count} user account(s). You can now register with any email address fresh.`,
    });
  } catch (error: any) {
    console.error("POST /api/admin/clean-users error:", error);
    return NextResponse.json(
      { error: "Failed to clean users from database", details: error?.message },
      { status: 500 }
    );
  }
}
