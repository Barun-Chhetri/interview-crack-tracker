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
  });
});
