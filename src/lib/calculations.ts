import { ActiveTimerState } from "./types";

/**
 * Calculates current active elapsed study time in seconds.
 * Excludes paused time and recovers accurately after page refresh.
 */
export function calculateElapsedSeconds(
  timer: ActiveTimerState,
  currentTimeMs: number = Date.now()
): number {
  if (!timer.isRunning || !timer.startTimestamp) {
    return timer.accumulatedSeconds || 0;
  }

  if (timer.isPaused) {
    return timer.accumulatedSeconds || 0;
  }

  const additionalSeconds = Math.max(
    0,
    Math.floor((currentTimeMs - timer.startTimestamp) / 1000)
  );

  return (timer.accumulatedSeconds || 0) + additionalSeconds;
}

/**
 * Calculates carryover minutes for a partially completed or unfinished task.
 * Carry over ONLY unfinished minutes, never the entire duration if time was spent.
 */
export function calculateCarryoverMinutes(
  plannedMinutes: number,
  actualMinutes: number
): number {
  const safePlanned = Math.max(0, plannedMinutes);
  const safeActual = Math.max(0, actualMinutes);
  return Math.max(0, safePlanned - safeActual);
}

/**
 * Calculates Spaced Repetition dates strictly from the original learning date.
 * Never calculates next review by adding interval to previous review date.
 */
export function calculateSpacedReviewDates(
  originalDateIso: string
): Array<{ interval: string; offsetDays: number; dueDate: string }> {
  const intervals = [
    { interval: "R1", offsetDays: 1 },
    { interval: "R3", offsetDays: 3 },
    { interval: "R7", offsetDays: 7 },
    { interval: "R14", offsetDays: 14 },
    { interval: "R30", offsetDays: 30 },
    { interval: "R60", offsetDays: 60 },
  ];

  const [year, month, day] = originalDateIso.split("-").map(Number);
  const baseDate = new Date(Date.UTC(year, month - 1, day));

  return intervals.map(({ interval, offsetDays }) => {
    const revDate = new Date(baseDate);
    revDate.setUTCDate(revDate.getUTCDate() + offsetDays);

    const y = revDate.getUTCFullYear();
    const m = String(revDate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(revDate.getUTCDate()).padStart(2, "0");

    return {
      interval,
      offsetDays,
      dueDate: `${y}-${m}-${d}`,
    };
  });
}

/**
 * Evaluates whether tomorrow's proposed workload exceeds the daily target.
 */
export function evaluateWorkload(
  originalMinutes: number,
  carriedMinutes: number,
  dailyTargetMinutes: number = 180
): {
  totalMinutes: number;
  totalHours: number;
  isOverloaded: boolean;
  excessMinutes: number;
  warningMessage: string | null;
} {
  const total = originalMinutes + carriedMinutes;
  const isOverloaded = total > dailyTargetMinutes;
  const excess = Math.max(0, total - dailyTargetMinutes);

  return {
    totalMinutes: total,
    totalHours: Number((total / 60).toFixed(1)),
    isOverloaded,
    excessMinutes: excess,
    warningMessage: isOverloaded
      ? `Workload exceeds daily 3-hour target by ${excess} minutes (${Number((total / 60).toFixed(1))}h total). Consider rebalancing or splitting tasks.`
      : null,
  };
}

/**
 * Calculates Schedule Adherence vs Actual Effort.
 * Schedule adherence: on-time completed planned minutes / original planned minutes.
 */
export function calculateAdherenceAndEffort(
  plannedMinutes: number,
  actualMinutes: number,
  completedOnTimeMinutes: number
): {
  scheduleAdherencePercent: number;
  actualEffortMinutes: number;
  actualEffortHours: number;
  metTarget: boolean;
} {
  const adherence =
    plannedMinutes > 0
      ? Math.min(100, Math.round((completedOnTimeMinutes / plannedMinutes) * 100))
      : 100;

  return {
    scheduleAdherencePercent: adherence,
    actualEffortMinutes: actualMinutes,
    actualEffortHours: Number((actualMinutes / 60).toFixed(2)),
    metTarget: actualMinutes >= plannedMinutes,
  };
}
