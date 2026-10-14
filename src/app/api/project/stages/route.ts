import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const DEFAULT_STAGES = [
  {
    stageNumber: 1,
    title: "Stage 1: Core Java Domain Model",
    focus: "Task class, status enum (PENDING, IN_PROGRESS, COMPLETED), due date validation, unit tests.",
    proofRequirements: "Explain class invariants, equals/hashCode contracts, and object references without notes.",
  },
  {
    stageNumber: 2,
    title: "Stage 2: In-Memory Spring Boot REST API",
    focus: "Controllers, service layer, DTOs, GET /tasks, POST /tasks, PUT /tasks/{id}, DELETE /tasks/{id}.",
    proofRequirements: "Curl test all HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found.",
  },
  {
    stageNumber: 3,
    title: "Stage 3: PostgreSQL JPA Persistence",
    focus: "Spring Data JPA, entity mappings, Hikari connection pooling, schema migrations.",
    proofRequirements: "Explain JDBC vs ORM, connection pool sizing, N+1 query problem, and foreign key cascades.",
  },
  {
    stageNumber: 4,
    title: "Stage 4: Automated Testing & Mocking",
    focus: "JUnit 5 unit tests, Mockito mocks, MockMvc controller integration tests, test isolation.",
    proofRequirements: "Achieve 80%+ test coverage, explain mock vs spy, and demonstrate green build pipeline.",
  },
  {
    stageNumber: 5,
    title: "Stage 5: Docker Containerization",
    focus: "Multi-stage Dockerfile, docker-compose orchestration (app + PostgreSQL), healthchecks.",
    proofRequirements: "Build and run multi-container environment with a single docker-compose up command.",
  },
];

export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;

    let stages = await prisma.projectStage.findMany({
      where: userId ? { userId } : {},
      orderBy: { stageNumber: "asc" },
    });

    // Auto-seed if empty
    if (stages.length === 0) {
      await Promise.all(
        DEFAULT_STAGES.map((s) =>
          prisma.projectStage.create({
            data: {
              ...s,
              userId,
              isCompleted: false,
            },
          })
        )
      );

      stages = await prisma.projectStage.findMany({
        where: userId ? { userId } : {},
        orderBy: { stageNumber: "asc" },
      });
    }

    return NextResponse.json(stages);
  } catch (error) {
    console.error("GET /api/project/stages error:", error);
    return NextResponse.json({ error: "Failed to fetch project stages" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isCompleted, notes, repoUrl } = body;

    if (!id) {
      return NextResponse.json({ error: "Stage ID is required" }, { status: 400 });
    }

    const updated = await prisma.projectStage.update({
      where: { id },
      data: {
        ...(isCompleted !== undefined ? { isCompleted: Boolean(isCompleted) } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(repoUrl !== undefined ? { repoUrl } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/project/stages error:", error);
    return NextResponse.json({ error: "Failed to update project stage" }, { status: 500 });
  }
}
