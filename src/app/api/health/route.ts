import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startTime = Date.now();
  let dbConnected = false;
  let dbError = null;
  let diagnostics = null;

  try {
    // Run real database query
    await prisma.$queryRaw`SELECT 1 as alive;`;
    dbConnected = true;
  } catch (error: unknown) {
    dbConnected = false;
    dbError = error instanceof Error ? error.message : "Database query failed";

    diagnostics = {
      targetHost: process.env.DB_HOST || "192.168.68.61",
      targetPort: process.env.DB_PORT || 5433,
      targetDatabase: process.env.DB_NAME || "barun_db",
      targetUser: process.env.DB_USERNAME || "barun",
      diagnosis:
        "PostgreSQL on host 192.168.68.61:5433 is currently unreachable (ECONNREFUSED). The PostgreSQL daemon or Docker container on the remote server is stopped.",
      remediationSteps: [
        "1. SSH into the Ubuntu host at 192.168.68.61",
        "2. Start the PostgreSQL container: `docker start <container_id>` (or `docker run -d --name barun_db -p 5433:5432 -e POSTGRES_USER=barun -e POSTGRES_PASSWORD=... -e POSTGRES_DB=barun_db postgres:16`)",
        "3. If using host PostgreSQL on port 5432 instead, grant access to user 'barun' or update DB_PORT=5432 in .env",
      ],
    };
  }

  const isPostgres = process.env.DATABASE_URL?.startsWith("postgres");
  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: dbConnected ? "healthy" : "database_unreachable",
      database: {
        type: isPostgres ? "PostgreSQL" : "SQLite",
        location: isPostgres ? (process.env.DB_HOST || "192.168.68.61:5433") : "prisma/dev.db (Local)",
        connected: dbConnected,
        responseTimeMs,
        error: dbError,
        diagnostics,
      },
      timestamp: new Date().toISOString(),
    },
    { status: dbConnected ? 200 : 503 }
  );
}
