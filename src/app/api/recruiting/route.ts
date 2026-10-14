import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const DEFAULT_CHECKLIST = [
  {
    category: "CPT / Legal",
    title: "Verify F-1 Full-Time Enrollment Requirement",
    detail: "Must complete 2 full consecutive semesters in F-1 status at UNT before Summer 2027 CPT authorization.",
    orderIndex: 1,
  },
  {
    category: "CPT / Legal",
    title: "Contact UNT International Student Office (ISSS)",
    detail: "Confirm CPT workshop completion, obtain CPT employer letter template, and verify internship course registration requirements.",
    orderIndex: 2,
  },
  {
    category: "Resume & Profile",
    title: "Finalize One-Page Technical Resume",
    detail: "Tailor Campus Task Tracker project bullet points with metrics (throughput, latency, database optimizations).",
    orderIndex: 3,
  },
  {
    category: "Resume & Profile",
    title: "Optimize LinkedIn & Handshake Profiles",
    detail: "Headline: UNT CS Junior | Aspiring SWE Intern (Summer 2027) | Java, Spring Boot, PostgreSQL, DSA.",
    orderIndex: 4,
  },
  {
    category: "Application Cadence",
    title: "Launch Summer 2027 Application Sprint",
    detail: "Target 5-10 tailored applications weekly across Dallas-Fort Worth tech firms, defense contractors, and remote positions.",
    orderIndex: 5,
  },
];

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;

    let checklist = await prisma.recruitingChecklistItem.findMany({
      where: userId ? { userId } : {},
      orderBy: { orderIndex: "asc" },
    });

    if (checklist.length === 0) {
      await Promise.all(
        DEFAULT_CHECKLIST.map((item) =>
          prisma.recruitingChecklistItem.create({
            data: {
              ...item,
              userId,
              isCompleted: false,
            },
          })
        )
      );

      checklist = await prisma.recruitingChecklistItem.findMany({
        where: userId ? { userId } : {},
        orderBy: { orderIndex: "asc" },
      });
    }

    const applications = await prisma.jobApplication.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      checklist,
      applications,
    });
  } catch (error) {
    console.error("GET /api/recruiting error:", error);
    return NextResponse.json({ error: "Failed to fetch recruiting data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const body = await request.json();
    const { type } = body;

    if (type === "application") {
      const { company, position, location, status, dateApplied, jobUrl, notes } = body;
      if (!company) {
        return NextResponse.json({ error: "Company name is required" }, { status: 400 });
      }

      const application = await prisma.jobApplication.create({
        data: {
          userId,
          company,
          position: position || "Software Engineering Intern (Summer 2027)",
          location: location || "",
          status: status || "Applied",
          dateApplied: dateApplied || new Date().toISOString().slice(0, 10),
          jobUrl: jobUrl || null,
          notes: notes || null,
        },
      });

      return NextResponse.json(application, { status: 201 });
    }

    if (type === "checklistItem") {
      const { title, category, detail } = body;
      if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }

      const item = await prisma.recruitingChecklistItem.create({
        data: {
          userId,
          title,
          category: category || "Application Cadence",
          detail: detail || null,
          isCompleted: false,
          orderIndex: 99,
        },
      });

      return NextResponse.json(item, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type specified" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/recruiting error:", error);
    return NextResponse.json({ error: "Failed to create recruiting entry" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (type === "checklistItem") {
      const { isCompleted } = body;
      const updated = await prisma.recruitingChecklistItem.update({
        where: { id },
        data: {
          isCompleted: Boolean(isCompleted),
          completedAt: isCompleted ? new Date() : null,
        },
      });
      return NextResponse.json(updated);
    }

    if (type === "application") {
      const { status, notes, company, position } = body;
      const updated = await prisma.jobApplication.update({
        where: { id },
        data: {
          ...(status !== undefined ? { status } : {}),
          ...(notes !== undefined ? { notes } : {}),
          ...(company !== undefined ? { company } : {}),
          ...(position !== undefined ? { position } : {}),
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid type specified" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/recruiting error:", error);
    return NextResponse.json({ error: "Failed to update recruiting entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (type === "application") {
      await prisma.jobApplication.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Application removed" });
    }

    if (type === "checklistItem") {
      await prisma.recruitingChecklistItem.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Checklist item removed" });
    }

    return NextResponse.json({ error: "Invalid type specified" }, { status: 400 });
  } catch (error) {
    console.error("DELETE /api/recruiting error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
