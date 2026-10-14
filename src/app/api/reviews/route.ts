import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // "dueToday", "overdue", "upcoming", "completed", "all"
    const date = searchParams.get("date") || "2026-10-14"; // Defaults to current or start date

    const todayDate = date;

    let reviews;

    if (filter === "dueToday") {
      reviews = await prisma.spacedReview.findMany({
        where: {
          dueDate: todayDate,
        },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      });
    } else if (filter === "overdue") {
      reviews = await prisma.spacedReview.findMany({
        where: {
          dueDate: { lt: todayDate },
          status: "Pending",
        },
        orderBy: { dueDate: "asc" },
      });
    } else if (filter === "upcoming") {
      reviews = await prisma.spacedReview.findMany({
        where: {
          dueDate: { gt: todayDate },
          status: "Pending",
        },
        orderBy: { dueDate: "asc" },
        take: 50,
      });
    } else if (filter === "completed") {
      reviews = await prisma.spacedReview.findMany({
        where: {
          status: "Completed",
        },
        orderBy: { completionDate: "desc" },
        take: 50,
      });
    } else {
      reviews = await prisma.spacedReview.findMany({
        orderBy: { dueDate: "asc" },
        take: 100,
      });
    }

    // Also get summary counts
    const dueCount = await prisma.spacedReview.count({
      where: { dueDate: todayDate, status: "Pending" },
    });
    const overdueCount = await prisma.spacedReview.count({
      where: { dueDate: { lt: todayDate }, status: "Pending" },
    });
    const completedCount = await prisma.spacedReview.count({
      where: { status: "Completed" },
    });

    return NextResponse.json({
      reviews,
      counts: {
        dueToday: dueCount,
        overdue: overdueCount,
        completed: completedCount,
      },
    });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to retrieve reviews" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, result, notes, currentDate } = body;

    if (!reviewId || !result) {
      return NextResponse.json({ error: "reviewId and result required" }, { status: 400 });
    }

    const review = await prisma.spacedReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const todayStr = currentDate || new Date().toISOString().slice(0, 10);

    // Update review
    const updatedReview = await prisma.spacedReview.update({
      where: { id: reviewId },
      data: {
        status: "Completed",
        result,
        completionDate: todayStr,
        notes: notes || review.notes,
      },
    });

    // If result was Needs Practice or Relearn:
    // Create an additional next-day repair attempt while preserving all original review dates
    let repairReview = null;
    if (result === "Needs Practice" || result === "Relearn") {
      const curr = new Date(todayStr);
      curr.setDate(curr.getDate() + 1);
      const nextDayStr = curr.toISOString().slice(0, 10);

      repairReview = await prisma.spacedReview.create({
        data: {
          studyDayId: review.studyDayId,
          anchorTitle: `[Repair] ${review.anchorTitle}`,
          anchorProblem: review.anchorProblem,
          pattern: review.pattern,
          originalDate: review.originalDate,
          intervalName: "Repair",
          dueDate: nextDayStr,
          status: "Pending",
          notes: `Next-day repair attempt following "${result}" on ${review.intervalName} review. Original schedule preserved.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
      repairScheduled: repairReview !== null,
      repairReview,
    });
  } catch (error) {
    console.error("PATCH /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}
