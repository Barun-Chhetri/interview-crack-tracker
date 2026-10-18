/**
 * Texas Real-Time & Audit Log Utilities
 *
 * All study time logs, focus timer sessions, daily audit breakdowns,
 * and curriculum scheduling are standardized to Texas Time (America/Chicago / Central Time),
 * reflecting the candidate's active location at the University of North Texas (UNT).
 */

export const TEXAS_TIMEZONE = "America/Chicago";

/**
 * Returns the current date formatted as YYYY-MM-DD in Texas Time (America/Chicago).
 * Unlike new Date().toISOString() which is UTC and rolls over prematurely in the evening,
 * this strictly preserves the current calendar date in Texas.
 */
export function getTexasIsoDate(date: Date | string | number = new Date()): string {
  const d = typeof date === "object" ? date : new Date(date);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TEXAS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date/timestamp into 12-hour format in Texas Time: "hh:mm A" (e.g., "09:00 AM", "01:45 PM").
 */
export function formatTexasTime12h(date: Date | string | number): string {
  const d = typeof date === "object" ? date : new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TEXAS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Formats a Date/timestamp into 12-hour format with Texas time zone name:
 * e.g., "09:00 AM CDT" or "09:00 AM CST".
 */
export function formatTexasTimeWithZone(date: Date | string | number): string {
  const d = typeof date === "object" ? date : new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TEXAS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(d);
}

/**
 * Live ticking clock format in Texas Time: "hh:mm:ss A" (e.g., "01:45:22 PM").
 */
export function formatTexasLiveClock(date: Date | string | number = new Date()): string {
  const d = typeof date === "object" ? date : new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TEXAS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Formats full date and time in Texas Time:
 * e.g., "Oct 18, 2026, 01:45 PM CDT".
 */
export function formatTexasDateTime(date: Date | string | number): string {
  const d = typeof date === "object" ? date : new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TEXAS_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(d);
}

/**
 * Returns the short abbreviation for Texas Time ("CDT" or "CST") for a given date.
 */
export function getTexasTzAbbreviation(date: Date | string | number = new Date()): string {
  const d = typeof date === "object" ? date : new Date(date);
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: TEXAS_TIMEZONE,
    timeZoneName: "short",
  })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName");

  return part?.value || "CT";
}

/**
 * Constructs a Date object that represents timeStr (e.g. "09:00:00") in Texas on dateStr (e.g. "2026-10-18").
 * Correctly accounts for Daylight Saving Time (CDT UTC-5 vs CST UTC-6).
 */
export function createTexasDate(dateStr: string, timeStr: string = "09:00:00"): Date {
  const noonUtc = new Date(`${dateStr}T12:00:00Z`);
  const isCST = getTexasTzAbbreviation(noonUtc) === "CST";
  const offset = isCST ? "-06:00" : "-05:00";
  return new Date(`${dateStr}T${timeStr}${offset}`);
}

/**
 * Computes which curriculum day (1 to 180) corresponds to today's real date in Texas.
 * Curriculum starts on October 14, 2026 (Day 1) and ends on April 11, 2027 (Day 180).
 */
export function getCurriculumDayForTexasDate(texasIsoDate?: string): number {
  const dateStr = texasIsoDate || getTexasIsoDate();
  const [y, m, d] = dateStr.split("-").map(Number);
  const targetUtc = Date.UTC(y, m - 1, d);
  const startUtc = Date.UTC(2026, 9, 14); // Oct 14, 2026 (month index 9)

  const diffDays = Math.floor((targetUtc - startUtc) / (24 * 60 * 60 * 1000));
  const dayNum = diffDays + 1;

  return Math.min(180, Math.max(1, dayNum));
}

/**
 * Formats a study session's start & end times into Texas Time interval breakdown.
 */
export function formatTexasSessionInterval(
  startTime: Date | string | number,
  endTime: Date | string | number,
  durationMinutes: number
): {
  startTimeFormatted: string;
  endTimeFormatted: string;
  displayTimeRange: string;
  logSummary: string;
  timezone: string;
  timezoneAbbr: string;
} {
  const startFmt = formatTexasTime12h(startTime);
  const endFmt = formatTexasTime12h(endTime);
  const tzAbbr = getTexasTzAbbreviation(startTime);

  return {
    startTimeFormatted: startFmt,
    endTimeFormatted: endFmt,
    displayTimeRange: `${startFmt} – ${endFmt}`,
    logSummary: `Started at ${startFmt} and stopped at ${endFmt} (${durationMinSafe(durationMinutes)} min spent)`,
    timezone: TEXAS_TIMEZONE,
    timezoneAbbr: tzAbbr,
  };
}

function durationMinSafe(m: number): number {
  return Math.max(1, Math.round(m));
}
