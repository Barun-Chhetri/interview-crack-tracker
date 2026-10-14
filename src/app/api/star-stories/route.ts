import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const DEFAULT_STAR_STORIES = [
  {
    category: "Conflict / Collaboration",
    question: "Tell me about a time you disagreed with an engineering or project teammate.",
    situation: "During our Operating Systems coursework group project, a partner wanted to use global mutable state across worker threads to skip passing synchronization context.",
    task: "I needed to align the team on thread safety without causing interpersonal friction or derailing our milestone deadline.",
    action: "I wrote a small benchmark showing data race condition under 50 concurrent requests, walked through the deadlock risk in office hours, and suggested a thread-confined message queue alternative.",
    result: "We integrated the queue architecture, completed stress tests with zero memory violations, and our team scored 98% on the milestone.",
    confidence: 4,
  },
  {
    category: "Failure / Resilience",
    question: "Describe a project that failed or a critical bug you introduced.",
    situation: "In an early full-stack project, an unindexed foreign key column caused cascading timeouts during simulated batch load testing.",
    task: "Diagnose why API latency spiked from 50ms to 4.2s under load and remediate the bottleneck before demo day.",
    action: "I profiled PostgreSQL query plans using EXPLAIN ANALYZE, identified a sequential table scan on 200,000 mock rows, added a composite B-tree index, and wrote regression load tests with k6.",
    result: "Average response latency dropped to 18ms, throughput increased 15x, and I documented query indexing best practices in our engineering wiki.",
    confidence: 5,
  },
  {
    category: "Ambiguity / Leadership",
    question: "Tell me about a time you handled ambiguous requirements with little direction.",
    situation: "Assigned to build a persistent study schedule tracker from an open-ended 180-day curriculum handbook.",
    task: "Turn ambiguous study targets into exact daily mathematical allocations, database schemas, and carryover algorithms.",
    action: "I extracted all 180 days into structured JSON, designed formal database relations for carryover undos and spaced reviews, and set up an accountability reporting loop with email verification.",
    result: "Delivered a full-stack, tested platform with persistent timers, zero-loss task carryover, and active recall tracking.",
    confidence: 5,
  },
];

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;

    let stories = await prisma.starStory.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
    });

    if (stories.length === 0) {
      await Promise.all(
        DEFAULT_STAR_STORIES.map((s) =>
          prisma.starStory.create({
            data: {
              ...s,
              userId,
              isCustom: false,
            },
          })
        )
      );

      stories = await prisma.starStory.findMany({
        where: userId ? { userId } : {},
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(stories);
  } catch (error) {
    console.error("GET /api/star-stories error:", error);
    return NextResponse.json({ error: "Failed to fetch STAR stories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const body = await request.json();

    const { category, question, situation, task, action, result, confidence } = body;

    if (!question || !situation || !action || !result) {
      return NextResponse.json(
        { error: "Question, Situation, Action, and Result are required" },
        { status: 400 }
      );
    }

    const story = await prisma.starStory.create({
      data: {
        userId,
        category: category || "General",
        question,
        situation,
        task: task || "",
        action,
        result,
        confidence: Number(confidence || 3),
        isCustom: true,
      },
    });

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    console.error("POST /api/star-stories error:", error);
    return NextResponse.json({ error: "Failed to create STAR story" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, category, question, situation, task, action, result, confidence } = body;

    if (!id) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
    }

    const updated = await prisma.starStory.update({
      where: { id },
      data: {
        ...(category !== undefined ? { category } : {}),
        ...(question !== undefined ? { question } : {}),
        ...(situation !== undefined ? { situation } : {}),
        ...(task !== undefined ? { task } : {}),
        ...(action !== undefined ? { action } : {}),
        ...(result !== undefined ? { result } : {}),
        ...(confidence !== undefined ? { confidence: Number(confidence) } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/star-stories error:", error);
    return NextResponse.json({ error: "Failed to update STAR story" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
    }

    await prisma.starStory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Story deleted" });
  } catch (error) {
    console.error("DELETE /api/star-stories error:", error);
    return NextResponse.json({ error: "Failed to delete STAR story" }, { status: 500 });
  }
}
