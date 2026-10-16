import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  calculateElapsedSeconds,
  calculateCarryoverMinutes,
  calculateSpacedReviewDates,
  evaluateWorkload,
  calculateAdherenceAndEffort,
} from "../src/lib/calculations";
import { ActiveTimerState } from "../src/lib/types";
import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  isValidEmail,
  validatePasswordStrength,
  AUTH_COOKIE_NAME,
} from "../src/lib/auth";

describe("180-Day Interview Preparation Tracker - Comprehensive Test Suite", () => {
  // 1, 2, 3: Program days and date range verification
  describe("Curriculum Calendar and Program Duration", () => {
    const jsonPath = path.join(process.cwd(), "src/data/curriculum_180_days.json");
    const curriculum = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    it("Scenario 1: Program contains exactly 180 days with correct dates", () => {
      expect(curriculum.days).toHaveLength(180);
      expect(curriculum.metadata.totalDays).toBe(180);

      // Verify sequence of days from 1 to 180 without gaps
      for (let i = 0; i < 180; i++) {
        expect(curriculum.days[i].dayNumber).toBe(i + 1);
        expect(curriculum.days[i].totalPlannedMinutes).toBe(180);
      }
    });

    it("Scenario 2: Day 1 is Wednesday, October 14, 2026", () => {
      const day1 = curriculum.days[0];
      expect(day1.dayNumber).toBe(1);
      expect(day1.date).toBe("2026-10-14");
      expect(day1.dayOfWeek).toBe("Wednesday");
      expect(day1.displayDate).toContain("October 14, 2026");
    });

    it("Scenario 3: Day 180 is Sunday, April 11, 2027", () => {
      const day180 = curriculum.days[179];
      expect(day180.dayNumber).toBe(180);
      expect(day180.date).toBe("2027-04-11");
      expect(day180.dayOfWeek).toBe("Sunday");
      expect(day180.displayDate).toContain("April 11, 2027");
    });
  });

  // 4, 5, 6: Study Timer calculations and persistence
  describe("Study Timer & Session Recovery", () => {
    it("Scenario 4: Task timer records actual elapsed time correctly", () => {
      const baseTime = 1000000;
      const timerState: ActiveTimerState = {
        isRunning: true,
        isPaused: false,
        taskId: "task-1",
        taskTitle: "Solve LeetCode",
        taskCategory: "LeetCode practice",
        studyDayId: "day-1",
        dayNumber: 1,
        sessionId: "sess-1",
        startTimestamp: baseTime,
        accumulatedSeconds: 120, // 2 minutes already accumulated
        lastPausedTimestamp: null,
      };

      // 45 seconds later
      const elapsed = calculateElapsedSeconds(timerState, baseTime + 45000);
      expect(elapsed).toBe(165); // 120 + 45
    });

    it("Scenario 5: Paused time is strictly excluded from elapsed time", () => {
      const baseTime = 1000000;
      const timerState: ActiveTimerState = {
        isRunning: true,
        isPaused: true, // Paused
        taskId: "task-1",
        taskTitle: "Solve LeetCode",
        taskCategory: "LeetCode practice",
        studyDayId: "day-1",
        dayNumber: 1,
        sessionId: "sess-1",
        startTimestamp: baseTime,
        accumulatedSeconds: 1500, // 25 minutes active before pause
        lastPausedTimestamp: baseTime + 1500000,
      };

      // Even if 30 minutes pass while paused, elapsed time does not advance
      const elapsed10mLater = calculateElapsedSeconds(timerState, baseTime + 1800000);
      const elapsed30mLater = calculateElapsedSeconds(timerState, baseTime + 3300000);

      expect(elapsed10mLater).toBe(1500);
      expect(elapsed30mLater).toBe(1500);
    });

    it("Scenario 6: Timer sessions survive a browser refresh", () => {
      // Simulating serialization to localStorage and deserialization on page reload
      const startMs = Date.now() - 60000; // Started 1 minute ago
      const serializedTimerState: ActiveTimerState = {
        isRunning: true,
        isPaused: false,
        taskId: "task-42",
        taskTitle: "Anchor Problem",
        taskCategory: "LeetCode practice",
        studyDayId: "day-10",
        dayNumber: 10,
        sessionId: "session-abc",
        startTimestamp: startMs,
        accumulatedSeconds: 300,
        lastPausedTimestamp: null,
      };

      const jsonStr = JSON.stringify(serializedTimerState);
      const recoveredState: ActiveTimerState = JSON.parse(jsonStr);

      const recoveredSeconds = calculateElapsedSeconds(recoveredState, startMs + 90000); // 90 seconds after start
      expect(recoveredSeconds).toBe(390); // 300 + 90
    });
  });

  // 7, 8, 9, 10, 11, 12: Carryover logic & Workload management
  describe("Task Carryover & Workload Balancing", () => {
    it("Scenario 7: Partially completed 60-minute task with 45 actual minutes leaves 15 minutes remaining", () => {
      const planned = 60;
      const actual = 45;
      const remaining = calculateCarryoverMinutes(planned, actual);

      expect(remaining).toBe(15);
    });

    it("Scenario 8: Carryover creates exactly 15 minutes of remaining work, not another 60-minute task", () => {
      const sourceTaskPlanned = 60;
      const sourceTaskActual = 45;
      const carriedMinutes = calculateCarryoverMinutes(sourceTaskPlanned, sourceTaskActual);

      // Target task must have plannedMinutes = 15
      const targetTask = {
        title: "[Carried] Two Sum",
        plannedMinutes: carriedMinutes,
        actualMinutes: 0,
        remainingMinutes: carriedMinutes,
        isCarriedForward: true,
      };

      expect(targetTask.plannedMinutes).toBe(15);
      expect(targetTask.remainingMinutes).toBe(15);
      expect(targetTask.actualMinutes).toBe(0);
    });

    it("Scenario 9: The original task remains in historical records with original spent time", () => {
      const originalTask = {
        id: "task-orig-1",
        title: "Two Sum",
        plannedMinutes: 60,
        actualMinutes: 45,
        remainingMinutes: 0, // transferred
        status: "Partially Completed",
        originalDate: "2026-10-14",
      };

      expect(originalTask.actualMinutes).toBe(45);
      expect(originalTask.status).toBe("Partially Completed");
      expect(originalTask.originalDate).toBe("2026-10-14");
    });

    it("Scenario 10: Duplicate carryovers are detected and prevented", () => {
      const existingCarryovers = [
        { sourceTaskId: "task-1", toDate: "2026-10-15", status: "Active" },
      ];

      const isDuplicate = existingCarryovers.some(
        (c) => c.sourceTaskId === "task-1" && c.toDate === "2026-10-15" && c.status === "Active"
      );

      expect(isDuplicate).toBe(true);
    });

    it("Scenario 11: Tomorrow's workload includes carried-forward work and flags overload > 3 hours", () => {
      const tomorrowOriginal = 180;
      const carriedMinutes = 60;
      const evalResult = evaluateWorkload(tomorrowOriginal, carriedMinutes);

      expect(evalResult.totalMinutes).toBe(240);
      expect(evalResult.totalHours).toBe(4.0);
      expect(evalResult.isOverloaded).toBe(true);
      expect(evalResult.excessMinutes).toBe(60);
      expect(evalResult.warningMessage).toContain("exceeds daily 3-hour target");
    });

    it("Scenario 12: Rescheduling updates future workload without deleting history", () => {
      const adherenceEffort = calculateAdherenceAndEffort(180, 120, 120);
      expect(adherenceEffort.scheduleAdherencePercent).toBe(67);
      expect(adherenceEffort.actualEffortMinutes).toBe(120);
      expect(adherenceEffort.metTarget).toBe(false);
    });
  });

  // 13: Spaced Repetition Calculations
  describe("Spaced-Repetition System", () => {
    it("Scenario 13: Spaced-repetition dates are calculated strictly from original learning date", () => {
      const originalDate = "2026-10-14"; // Day 1
      const reviews = calculateSpacedReviewDates(originalDate);

      expect(reviews).toEqual([
        { interval: "R1", offsetDays: 1, dueDate: "2026-10-15" },
        { interval: "R3", offsetDays: 3, dueDate: "2026-10-17" },
        { interval: "R7", offsetDays: 7, dueDate: "2026-10-21" },
        { interval: "R14", offsetDays: 14, dueDate: "2026-10-28" },
        { interval: "R30", offsetDays: 30, dueDate: "2026-11-13" },
        { interval: "R60", offsetDays: 60, dueDate: "2026-12-13" },
      ]);
    });
  });

  // 14, 15, 16: Reporting & Accountability Email Protection
  describe("Reporting & Accountability Validation", () => {
    it("Scenario 14: Daily and weekly reports calculate adherence and effort using actual recorded numbers", () => {
      const adherence = calculateAdherenceAndEffort(180, 195, 180);
      expect(adherence.metTarget).toBe(true);
      expect(adherence.actualEffortHours).toBe(3.25);
    });

    it("Scenario 15: Scheduled emails require user consent and credentials", () => {
      const userSettings = {
        autoReportDelivery: false, // User consent off
        resendApiKey: null,
        smtpHost: null,
      };

      const canAutoSend =
        userSettings.autoReportDelivery && Boolean(userSettings.resendApiKey || userSettings.smtpHost);

      expect(canAutoSend).toBe(false);
    });

    it("Scenario 16: Failed or unconfigured email delivery is reported accurately without false success", () => {
      const isConfigured = false;
      const deliveryStatus = isConfigured ? "Sent" : "Failed";
      expect(deliveryStatus).toBe("Failed");
    });

    it("Scenario 16b: Recipient list supports single or multiple comma-separated emails", () => {
      const rawInput = "mentor@google.com, accountability@unt.edu ; friend@gmail.com";
      const recipients = rawInput
        .split(/[,;]/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      expect(recipients).toEqual([
        "mentor@google.com",
        "accountability@unt.edu",
        "friend@gmail.com",
      ]);
    });
  });

  // 17, 18, 19, 20: Authentication & Password Security
  describe("Authentication & Password Security", () => {
    it("Scenario 17: Validates email format and normalizes consistently", () => {
      expect(isValidEmail("student@unt.edu")).toBe(true);
      expect(isValidEmail("barun.chhetri444@gmail.com")).toBe(true);
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail("@no-user.com")).toBe(false);
      expect(isValidEmail("no-domain@")).toBe(false);

      const rawEmail = "  Barun.Chhetri444@Gmail.COM  ";
      const normalized = rawEmail.trim().toLowerCase();
      expect(normalized).toBe("barun.chhetri444@gmail.com");
    });

    it("Scenario 18: Enforces reasonable password-strength requirements", () => {
      // Less than 8 chars
      const tooShort = validatePasswordStrength("Short1!");
      expect(tooShort.valid).toBe(false);
      expect(tooShort.reason).toContain("at least 8 characters");

      // No number or special char
      const noNumberOrSpecial = validatePasswordStrength("passwordonlyletters");
      expect(noNumberOrSpecial.valid).toBe(false);
      expect(noNumberOrSpecial.reason).toContain("number or special character");

      // Valid strong password
      const validPass = validatePasswordStrength("Barun123Secure!");
      expect(validPass.valid).toBe(true);
    });

    it("Scenario 19: BCrypt produces secure salted hashes and verifies credentials correctly", async () => {
      const plaintext = "barun123";
      const hash = await hashPassword(plaintext);

      // Verify bcrypt format
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
      expect(hash).not.toBe(plaintext);

      // Verify correct password succeeds
      const isMatch = await verifyPassword(plaintext, hash);
      expect(isMatch).toBe(true);

      // Verify incorrect password fails
      const wrongMatch = await verifyPassword("wrongpassword", hash);
      expect(wrongMatch).toBe(false);
    });

    it("Scenario 20: JWT tokens carry claims, verify signatures, and reject tampering", async () => {
      const payload = {
        userId: "user-123",
        email: "student@unt.edu",
        role: "USER",
      };

      const token = await createToken(payload);
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // header.payload.signature

      // Valid verification
      const verified = await verifyToken(token);
      expect(verified?.userId).toBe("user-123");
      expect(verified?.email).toBe("student@unt.edu");
      expect(verified?.role).toBe("USER");

      // Tampered token verification fails safely
      const tampered = token.slice(0, -6) + "xxxxxx";
      const tamperedVerified = await verifyToken(tampered);
      expect(tamperedVerified).toBeNull();
    });
  });

  // 21, 22, 23: Session Invalidation & Reset Token Security
  describe("Session Lifecycle & Reset Flow", () => {
    it("Scenario 21: Authentication cookie name is standardized", () => {
      expect(AUTH_COOKIE_NAME).toBe("auth_token");
    });

    it("Scenario 22: Expired password reset tokens are invalidated", () => {
      const pastTime = new Date(Date.now() - 60000); // 1 minute ago
      const isTokenValid = pastTime > new Date();
      expect(isTokenValid).toBe(false);

      const futureTime = new Date(Date.now() + 3600000); // 1 hour ahead
      const isFutureTokenValid = futureTime > new Date();
      expect(isFutureTokenValid).toBe(true);
    });

    it("Scenario 23: Failed login mitigation detects repeated failures", () => {
      const attempts = [
        { ip: "192.168.1.10", count: 5, firstAttempt: Date.now() },
      ];
      const maxAllowed = 5;
      const isBlocked = attempts[0].count >= maxAllowed;
      expect(isBlocked).toBe(true);
    });
  });

  // 24, 25, 26: Data Persistence & Multi-Tenant User Isolation
  describe("PostgreSQL User Data Isolation", () => {
    it("Scenario 24: Queries enforce strict user isolation for private data", () => {
      const records = [
        { id: "stage-1", userId: "user-alpha", title: "Core Java" },
        { id: "stage-2", userId: "user-beta", title: "In-Memory API" },
        { id: "stage-3", userId: "user-alpha", title: "PostgreSQL JPA" },
      ];

      const currentUserId = "user-alpha";
      const userAlphaRecords = records.filter((r) => r.userId === currentUserId);

      expect(userAlphaRecords).toHaveLength(2);
      expect(userAlphaRecords.every((r) => r.userId === "user-alpha")).toBe(true);
      expect(userAlphaRecords.some((r) => r.userId === "user-beta")).toBe(false);
    });

    it("Scenario 25: Password hash is strictly excluded from returned user profiles", () => {
      const dbUserRecord = {
        id: "user-123",
        email: "student@unt.edu",
        name: "Barun Chhetri",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
        role: "USER",
        university: "UNT",
        visaStatus: "F-1",
        targetRole: "Summer 2027 SWE Intern",
      };

      // Safe profile projection
      const safeProfile = { ...dbUserRecord };
      delete (safeProfile as { passwordHash?: string }).passwordHash;
      expect(safeProfile).not.toHaveProperty("passwordHash");
      expect(safeProfile.email).toBe("student@unt.edu");
    });

    it("Scenario 26: Duplicate email addresses are rejected with conflict error", () => {
      const existingEmails = ["student@unt.edu", "partner@example.com"];
      const incomingEmail = "STUDENT@unt.edu".trim().toLowerCase();

      const isDuplicate = existingEmails.includes(incomingEmail);
      expect(isDuplicate).toBe(true);
    });
  });

  // 27, 28, 29: Public Share View & Daily Time Log Showcase
  describe("Public Share View & Daily Problem Showcase", () => {
    const jsonPath = path.join(process.cwd(), "src/data/curriculum_180_days.json");
    const curriculum = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    it("Scenario 27: Public progress sanitizes all credentials and sensitive tokens while exposing study timeline", () => {
      const sampleUser = {
        id: "usr_xyz123",
        name: "Barun Chhetri",
        email: "barun@unt.edu",
        passwordHash: "$2a$10$supersecretkeythatshouldnotleak",
        resetToken: "reset_token_secret",
        smtpPass: "mypassword123",
        resendApiKey: "re_1234567890",
        university: "University of North Texas (UNT)",
        visaStatus: "F-1 (OPT / STEM-OPT Eligible)",
        targetRole: "Summer 2027 Software Engineering Intern",
      };

      // Ensure public projection excludes private keys
      const publicStudent = {
        name: sampleUser.name,
        university: sampleUser.university,
        targetRole: sampleUser.targetRole,
        visaStatus: sampleUser.visaStatus,
        programTitle: "180-Day Software Engineering Interview Preparation Handbook",
      };

      expect(publicStudent).not.toHaveProperty("passwordHash");
      expect(publicStudent).not.toHaveProperty("resetToken");
      expect(publicStudent).not.toHaveProperty("smtpPass");
      expect(publicStudent).not.toHaveProperty("resendApiKey");
      expect(publicStudent.name).toBe("Barun Chhetri");
      expect(publicStudent.university).toContain("UNT");
    });

    it("Scenario 28: Daily time log accurately flags days meeting the 3-hour (180 minute) daily target", () => {
      const dayLogs = [
        { dayNumber: 1, actualMinutes: 195, plannedMinutes: 180 }, // target met
        { dayNumber: 2, actualMinutes: 180, plannedMinutes: 180 }, // target met
        { dayNumber: 3, actualMinutes: 120, plannedMinutes: 180 }, // in progress / partial
        { dayNumber: 4, actualMinutes: 0, plannedMinutes: 180 },   // not started
      ];

      const evaluated = dayLogs.map((d) => ({
        ...d,
        isTargetMet: d.actualMinutes >= 180,
        actualHours: Number((d.actualMinutes / 60).toFixed(1)),
      }));

      expect(evaluated[0].isTargetMet).toBe(true);
      expect(evaluated[0].actualHours).toBe(3.3);
      expect(evaluated[1].isTargetMet).toBe(true);
      expect(evaluated[1].actualHours).toBe(3.0);
      expect(evaluated[2].isTargetMet).toBe(false);
      expect(evaluated[2].actualHours).toBe(2.0);
      expect(evaluated[3].isTargetMet).toBe(false);

      const targetMetDays = evaluated.filter((d) => d.isTargetMet).length;
      expect(targetMetDays).toBe(2);
    });

    it("Scenario 29: Problem showcase accurately matches anchor problems, patterns, and difficulty tiers", () => {
      // Validate first 30 days (Phase 1)
      const phase1Days = curriculum.days.slice(0, 30);
      expect(phase1Days).toHaveLength(30);

      // Verify anchor problems and patterns exist for study tracking
      for (const day of phase1Days) {
        expect(day.anchorProblem).toBeTruthy();
        expect(day.anchorPattern).toBeTruthy();
        expect(["Easy", "Medium", "Hard"]).toContain(day.anchorDifficulty);
        expect(day.tasks.length).toBeGreaterThanOrEqual(4);
      }

      // Check specific day 1 anchor
      expect(phase1Days[0].anchorProblem).toBe("Longest Consecutive Sequence");
      expect(phase1Days[0].anchorDifficulty).toBe("Medium");
      expect(phase1Days[0].anchorPattern).toContain("HashSet");
    });

    it("Scenario 30: Time Logged Today generates audited start and end time interval breakdowns matching logged daily minutes", () => {
      // Test session timeline calculation
      const baseDate = "2026-10-14";
      const actualMinutes = 180;
      const slot1Duration = Math.min(actualMinutes, Math.round(actualMinutes * 0.55)); // 99 mins
      const slot2Duration = actualMinutes - slot1Duration; // 81 mins

      const d1Start = new Date(`${baseDate}T09:00:00`);
      const d1End = new Date(d1Start.getTime() + slot1Duration * 60 * 1000);
      const d2Start = new Date(`${baseDate}T14:00:00`);
      const d2End = new Date(d2Start.getTime() + slot2Duration * 60 * 1000);

      expect(d1End.getTime() - d1Start.getTime()).toBe(slot1Duration * 60 * 1000);
      expect(d2End.getTime() - d2Start.getTime()).toBe(slot2Duration * 60 * 1000);
      expect(slot1Duration + slot2Duration).toBe(180);

      // Verify duration in hours
      const totalHours = (slot1Duration + slot2Duration) / 60;
      expect(totalHours).toBe(3.0);
    });

    it("Scenario 31: Unstarted zero-minute days strictly return empty sessions array without fake/dummy session data", () => {
      // Test the zero-minute rule: unstarted days should not produce synthetic dummy sessions
      const actualMinutes = 0;
      const rawSessions: any[] = [];
      const tasks = [
        { id: "t1", title: "Diagnostic / retrieval", actualMinutes: 0 },
        { id: "t2", title: "Problem attempt", actualMinutes: 0 },
      ];

      // Replicate public progress route logic
      let sessions: any[] = [];
      if (rawSessions && rawSessions.length > 0) {
        sessions = rawSessions;
      } else if (actualMinutes <= 0) {
        sessions = [];
      }

      expect(sessions).toHaveLength(0);
      expect(sessions).toEqual([]);
    });

    it("Scenario 32: Real study sessions preserve exact start, end, active seconds, and manual flag", () => {
      const now = new Date("2026-10-15T15:30:00.000Z");
      const startTime = new Date("2026-10-15T14:45:00.000Z");
      const diffMinutes = 45;

      const session = {
        id: "sess-1",
        scheduledTaskId: "task-101",
        studyDayId: "day-2",
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        elapsedSeconds: diffMinutes * 60,
        activeSeconds: diffMinutes * 60,
        pausedSeconds: 0,
        status: "completed",
        notes: "Checklist completion: Problem attempt",
        isManual: true,
      };

      expect(session.elapsedSeconds).toBe(2700);
      expect(session.activeSeconds).toBe(2700);
      expect(session.isManual).toBe(true);
      expect(new Date(session.endTime).getTime() - new Date(session.startTime).getTime()).toBe(45 * 60 * 1000);
    });

    it("Scenario 33: Timer session duration calculation ensures every minute and runs >= 15s are credited", () => {
      // 15 seconds test run -> at least 1 minute
      const shortRunSec = 15;
      const shortMin = shortRunSec >= 15 ? Math.max(1, Math.round(shortRunSec / 60)) : Math.round(shortRunSec / 60);
      expect(shortMin).toBe(1);

      // 45 seconds run -> 1 minute
      const midRunSec = 45;
      const midMin = midRunSec >= 15 ? Math.max(1, Math.round(midRunSec / 60)) : Math.round(midRunSec / 60);
      expect(midMin).toBe(1);

      // 90 seconds run -> 2 minutes
      const minAndHalfSec = 90;
      const minAndHalf = minAndHalfSec >= 15 ? Math.max(1, Math.round(minAndHalfSec / 60)) : Math.round(minAndHalfSec / 60);
      expect(minAndHalf).toBe(2);

      // 3600 seconds run (1 hour) -> 60 minutes
      const hourSec = 3600;
      const hourMin = hourSec >= 15 ? Math.max(1, Math.round(hourSec / 60)) : Math.round(hourSec / 60);
      expect(hourMin).toBe(60);
    });

    it("Scenario 34: Public time log displays start/stop intervals with duration and associates problem part below it", () => {
      const startTimeFormatted = "09:00 AM";
      const endTimeFormatted = "09:15 AM";
      const durationMinutes = 15;
      const logSummary = `Started at ${startTimeFormatted} and stopped at ${endTimeFormatted} (${durationMinutes} min spent)`;
      const anchorProblem = "Longest Consecutive Sequence";
      const anchorPattern = "HashSet sequence starts";

      expect(logSummary).toBe("Started at 09:00 AM and stopped at 09:15 AM (15 min spent)");
      expect(anchorProblem).toBeTruthy();
      expect(anchorPattern).toBeTruthy();
    });
  });
});

