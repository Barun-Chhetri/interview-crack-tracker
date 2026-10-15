import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  const defaultPasswordHash = bcrypt.hashSync("Password123!", 10);

  // 1. Create or upsert default student user
  const user = await prisma.user.upsert({
    where: { email: "student@unt.edu" },
    update: {
      passwordHash: defaultPasswordHash,
    },
    create: {
      email: "student@unt.edu",
      name: "Barun Chhetri",
      passwordHash: defaultPasswordHash,
      role: "USER",
      university: "University of North Texas (UNT)",
      visaStatus: "F-1",
      targetRole: "Summer 2027 Software Engineering Intern",
      settings: {
        create: {
          dailyTargetMinutes: 180,
          weeklyTargetHours: 21,
          timezone: "America/Chicago",
          theme: "dark",
          autoReportDelivery: false,
          autoReportFrequency: "daily",
        },
      },
      recipients: {
        create: [
          {
            name: "Mentor / Accountability Partner",
            email: "partner@example.com",
            relationship: "Accountability Partner",
            receiveDaily: true,
            receiveWeekly: true,
            receiveMonthly: true,
            isEnabled: true,
          },
        ],
      },
    },
  });

  // Also seed primary personal account if not already created
  await prisma.user.upsert({
    where: { email: "barun.chhetri444@gmail.com" },
    update: {},
    create: {
      email: "barun.chhetri444@gmail.com",
      name: "Barun Chhetri",
      passwordHash: defaultPasswordHash,
      role: "USER",
      university: "University of North Texas (UNT)",
      visaStatus: "F-1",
      targetRole: "Summer 2027 Software Engineering Intern",
    },
  });

  console.log(`User seeded: ${user.name} (${user.email})`);

  // 2. Create or upsert Program
  const program = await prisma.program.upsert({
    where: { id: "swe-180-handbook" },
    update: {},
    create: {
      id: "swe-180-handbook",
      title: "180-Day Software Engineering Interview Preparation Handbook",
      startDate: "2026-10-14",
      endDate: "2027-04-11",
      totalDays: 180,
      dailyTargetMinutes: 180,
      weeklyTargetHours: 21,
      totalPlannedHours: 540,
    },
  });

  // 3. Load curriculum JSON
  const jsonPath = path.join(process.cwd(), "src/data/curriculum_180_days.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Curriculum file not found at ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);
  const days = data.days;

  console.log(`Loading ${days.length} days into database...`);

  let totalTasks = 0;
  let totalReviews = 0;

  for (const day of days) {
    const studyDay = await prisma.studyDay.upsert({
      where: { dayNumber: day.dayNumber },
      update: {
        displayDate: day.displayDate,
        phase: day.phase,
        topic: day.topic,
        learningObjective: day.learningObjective,
        anchorProblem: day.anchorProblem,
        anchorDifficulty: day.anchorDifficulty,
        anchorPattern: day.anchorPattern,
        anchorInstructions: day.anchorInstructions,
        queueText: day.queueText,
        secondaryTask: day.secondaryTask,
        deliverable: day.deliverable,
        completionCriterion: day.completionCriterion,
        anchorReviewDates: day.anchorReviewDates,
        totalPlannedMinutes: day.totalPlannedMinutes,
      },
      create: {
        dayNumber: day.dayNumber,
        weekNumber: day.weekNumber,
        date: day.date,
        dayOfWeek: day.dayOfWeek,
        displayDate: day.displayDate,
        phase: day.phase,
        topic: day.topic,
        learningObjective: day.learningObjective,
        anchorProblem: day.anchorProblem,
        anchorDifficulty: day.anchorDifficulty,
        anchorPattern: day.anchorPattern,
        anchorInstructions: day.anchorInstructions,
        queueText: day.queueText,
        secondaryTask: day.secondaryTask,
        deliverable: day.deliverable,
        completionCriterion: day.completionCriterion,
        anchorReviewDates: day.anchorReviewDates,
        totalPlannedMinutes: day.totalPlannedMinutes,
        actualMinutes: 0,
        status: "Not Started",
        programId: program.id,
        userId: user.id,
      },
    });

    // Check if tasks already exist for this day
    const existingTasksCount = await prisma.scheduledTask.count({
      where: { studyDayId: studyDay.id },
    });

    if (existingTasksCount === 0) {
      for (let idx = 0; idx < day.tasks.length; idx++) {
        const t = day.tasks[idx];
        const isAnchor =
          Boolean(day.anchorProblem) &&
          (t.title.toLowerCase().includes("anchor") ||
            t.title.toLowerCase().includes("problem attempt") ||
            t.title.toLowerCase().includes("timed interview") ||
            (day.anchorProblem && t.instruction?.toLowerCase().includes(day.anchorProblem.toLowerCase())));

        await prisma.scheduledTask.create({
          data: {
            studyDayId: studyDay.id,
            title: t.title,
            instruction: t.instruction,
            category: t.category,
            plannedMinutes: t.plannedMinutes,
            actualMinutes: 0,
            remainingMinutes: t.plannedMinutes,
            priority: t.priority || 3,
            status: "Not Started",
            originalDate: day.date,
            currentDate: day.date,
            isAnchor,
            resourceUrl: t.resourceUrl,
            orderIndex: idx,
          },
        });
        totalTasks++;
      }
    }

    // Schedule Spaced Reviews
    if (day.scheduledReviews && day.scheduledReviews.length > 0) {
      for (const rev of day.scheduledReviews) {
        // Only insert if not already present
        const existingRev = await prisma.spacedReview.findFirst({
          where: {
            anchorTitle: rev.anchorTitle,
            originalDate: rev.originalDate,
            intervalName: rev.intervalName,
          },
        });

        if (!existingRev) {
          await prisma.spacedReview.create({
            data: {
              studyDayId: studyDay.id,
              anchorTitle: rev.anchorTitle,
              anchorProblem: rev.anchorProblem,
              pattern: rev.pattern,
              originalDate: rev.originalDate,
              intervalName: rev.intervalName,
              dueDate: rev.dueDate,
              status: "Pending",
            },
          });
          totalReviews++;
        }
      }
    }
  }

  console.log(`Database seeded successfully!`);
  console.log(`- Total Study Days: 180`);
  console.log(`- Total Tasks Created: ${totalTasks}`);
  console.log(`- Total Spaced Reviews Created: ${totalReviews}`);
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
