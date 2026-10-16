export type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "Partially Completed"
  | "Carried Forward"
  | "Missed";

export type DayStatus =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "Partially Completed"
  | "Carried Forward"
  | "Missed";

export type ReviewResultType = "Strong" | "Needs Practice" | "Relearn";

export interface ScheduledTaskDTO {
  id: string;
  studyDayId: string;
  title: string;
  instruction?: string | null;
  category: string;
  plannedMinutes: number;
  actualMinutes: number;
  remainingMinutes: number;
  priority: number;
  status: TaskStatus;
  notes?: string | null;
  resourceUrl?: string | null;
  originalDate: string;
  currentDate: string;
  isAnchor: boolean;
  isCarriedForward: boolean;
  sourceTaskId?: string | null;
  carryoverCount: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudyDayDTO {
  id: string;
  dayNumber: number;
  weekNumber: number;
  date: string;
  dayOfWeek: string;
  displayDate: string;
  phase: string;
  topic: string;
  learningObjective: string;
  anchorProblem?: string | null;
  anchorDifficulty?: string | null;
  anchorPattern?: string | null;
  anchorInstructions?: string | null;
  queueText?: string | null;
  secondaryTask?: string | null;
  deliverable?: string | null;
  completionCriterion?: string | null;
  anchorReviewDates?: string | null;
  totalPlannedMinutes: number;
  actualMinutes: number;
  status: DayStatus;
  notes?: string | null;
  confidenceRating?: number | null;
  tasks: ScheduledTaskDTO[];
  reviewsDue?: SpacedReviewDTO[];
}

export interface StudySessionDTO {
  id: string;
  scheduledTaskId?: string | null;
  studyDayId?: string | null;
  startTime: string;
  endTime?: string | null;
  elapsedSeconds: number;
  activeSeconds: number;
  pausedSeconds: number;
  status: "active" | "paused" | "completed" | "cancelled";
  notes?: string | null;
  isManual: boolean;
  auditLog?: string | null;
  createdAt: string;
}

export interface CarryoverRecordDTO {
  id: string;
  sourceTaskId: string;
  targetTaskId?: string | null;
  fromDate: string;
  toDate: string;
  originalMinutes: number;
  carriedMinutes: number;
  status: "Active" | "Completed" | "Undone";
  reason?: string | null;
  createdAt: string;
  sourceTask?: {
    title: string;
    category: string;
  };
}

export interface SpacedReviewDTO {
  id: string;
  studyDayId?: string | null;
  anchorTitle: string;
  anchorProblem: string;
  pattern?: string | null;
  originalDate: string;
  intervalName: string;
  dueDate: string;
  status: "Pending" | "Completed" | "Missed";
  result?: ReviewResultType | null;
  completionDate?: string | null;
  notes?: string | null;
}

export interface DailyReportDTO {
  id: string;
  studyDayId: string;
  date: string;
  dayNumber: number;
  plannedMinutes: number;
  actualMinutes: number;
  completedTasksCount: number;
  partialTasksCount: number;
  carriedTasksCount: number;
  missedTasksCount: number;
  independentSolves: number;
  neededHints: number;
  fullSolution: number;
  topicsReviewed?: string | null;
  mistakesDiscovered?: string | null;
  confidenceRating: number;
  tomorrowPriorities?: string | null;
  generatedAt: string;
}

export interface WeeklyReportDTO {
  id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  plannedHours: number;
  actualHours: number;
  adherencePercent: number;
  totalProblemsAttempted: number;
  independentSolves: number;
  spacedRepSuccessRate: number;
  weakestTopics?: string | null;
  strongestTopics?: string | null;
  carryoverRemainingMinutes: number;
  recommendations?: string | null;
  summary?: string | null;
  generatedAt: string;
}

export interface ReportRecipientDTO {
  id: string;
  name: string;
  email: string;
  relationship?: string | null;
  receiveDaily: boolean;
  receiveWeekly: boolean;
  receiveMonthly: boolean;
  isEnabled: boolean;
}

export interface ReportDeliveryDTO {
  id: string;
  recipientEmail: string;
  reportType: string;
  reportDate: string;
  status: "Pending" | "Sent" | "Failed" | "Simulated";
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface ActiveTimerState {
  isRunning: boolean;
  isPaused: boolean;
  taskId: string | null;
  taskTitle: string | null;
  taskCategory: string | null;
  studyDayId: string | null;
  dayNumber: number | null;
  sessionId: string | null;
  startTimestamp: number | null; // Date.now() when last started/resumed
  sessionStartTimestamp?: number | null; // Date.now() when session was first started
  accumulatedSeconds: number; // Active seconds accumulated before last resume
  lastPausedTimestamp: number | null;
}
