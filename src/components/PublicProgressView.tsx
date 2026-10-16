"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  Calendar,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Flame,
  Layers,
  BookOpen,
  Code2,
  RefreshCw,
  X,
  ExternalLink,
  ListOrdered,
  Activity,
  Award,
} from "lucide-react";

interface PublicStudent {
  name: string;
  university: string;
  targetRole: string;
  visaStatus: string;
  programTitle: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  dailyTargetHours: number;
  weeklyTargetHours: number;
  totalPlannedHours: number;
}

interface PublicStats {
  totalDays: number;
  completedDays: number;
  inProgressDays: number;
  actualMinutes: number;
  actualHours: number;
  plannedMinutes: number;
  plannedHours: number;
  programProgressPercent: number;
  daysMeetingTarget: number;
  consistencyRate: number;
  problemsSolvedCount: number;
  easyProblemsCount: number;
  mediumProblemsCount: number;
  hardProblemsCount: number;
  totalAnchorProblems: number;
}

interface PublicPhase {
  id: number;
  name: string;
  days: string;
  range: number[];
  totalDays: number;
  completedDays: number;
  inProgressDays: number;
  actualMinutes: number;
  actualHours: number;
  plannedHours: number;
  problemsSolved: number;
  percent: number;
}

interface PublicTask {
  title: string;
  category: string;
  plannedMinutes: number;
  actualMinutes: number;
  status: string;
  isAnchor: boolean;
}

export interface PublicSession {
  id: string;
  sessionIndex: number;
  startTime: string;
  endTime: string;
  displayTimeRange: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
  durationMinutes: number;
  durationHours: number;
  taskTitle: string;
  category: string;
  status: string;
  notes?: string | null;
  isManual?: boolean;
}

interface PublicDay {
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
  secondaryTask?: string | null;
  deliverable?: string | null;
  completionCriterion?: string | null;
  actualMinutes: number;
  actualHours: number;
  totalPlannedMinutes: number;
  plannedHours: number;
  status: string;
  isTargetMet: boolean;
  isAnchorSolved: boolean;
  confidenceRating?: number;
  totalTasksCount: number;
  completedTasksCount: number;
  tasks: PublicTask[];
  sessions?: PublicSession[];
}

export function PublicProgressView() {
  const [student, setStudent] = useState<PublicStudent>({
    name: "Barun Chhetri",
    university: "University of North Texas (UNT)",
    targetRole: "Summer 2027 Software Engineering Intern",
    visaStatus: "F-1 (OPT / STEM-OPT Eligible)",
    programTitle: "180-Day Software Engineering Interview Preparation Handbook",
    startDate: "2026-10-14",
    endDate: "2027-04-11",
    totalDays: 180,
    dailyTargetHours: 3.0,
    weeklyTargetHours: 21.0,
    totalPlannedHours: 540,
  });

  const [stats, setStats] = useState<PublicStats | null>(null);
  const [phases, setPhases] = useState<PublicPhase[]>([]);
  const [days, setDays] = useState<PublicDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "in-progress" | "logged">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "Easy" | "Medium" | "Hard">("all");
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Time detail breakdown states
  const [todayTimeViewMode, setTodayTimeViewMode] = useState<"sessions" | "tasks">("sessions");
  const [sessionModalDay, setSessionModalDay] = useState<PublicDay | null>(null);
  const [dayViewModeMap, setDayViewModeMap] = useState<Record<number, "sessions" | "tasks">>({});

  const fetchPublicProgress = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/public/progress");
      if (res.ok) {
        const data = await res.json();
        if (data.student) setStudent(data.student);
        if (data.stats) setStats(data.stats);
        if (data.phases) setPhases(data.phases);
        if (data.days) setDays(data.days);
      }
    } catch (err) {
      console.error("Failed to load public progress:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicProgress();
  }, []);

  // Compute Today's Problem / Active Study Day
  const todayDay = useMemo(() => {
    if (days.length === 0) return null;
    const todayStr = new Date().toISOString().split("T")[0];
    const exactDateMatch = days.find((d) => d.date === todayStr);
    if (exactDateMatch) return exactDateMatch;

    // Check last day with actual study time or completed status
    const activeOrDone = [...days].reverse().find((d) => d.status === "Completed" || d.actualMinutes > 0);
    if (activeOrDone) return activeOrDone;

    // Default to Day 1
    return days[0];
  }, [days]);

  // Filtered days list
  const filteredDays = useMemo(() => {
    return days.filter((d) => {
      // Phase filter
      if (selectedPhase !== "all") {
        const phaseObj = phases.find((p) => p.id === selectedPhase);
        if (phaseObj) {
          if (d.dayNumber < phaseObj.range[0] || d.dayNumber > phaseObj.range[1]) {
            return false;
          }
        }
      }

      // Status filter
      if (statusFilter === "completed" && d.status !== "Completed") return false;
      if (statusFilter === "in-progress" && d.status !== "In Progress") return false;
      if (statusFilter === "logged" && d.actualMinutes === 0) return false;

      // Difficulty filter
      if (difficultyFilter !== "all" && d.anchorDifficulty !== difficultyFilter) return false;

      // Search query (anchor problem, topic, pattern)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = d.anchorProblem?.toLowerCase().includes(q);
        const matchTopic = d.topic.toLowerCase().includes(q);
        const matchPattern = d.anchorPattern?.toLowerCase().includes(q);
        const matchDay = `day ${d.dayNumber}`.includes(q);
        if (!matchTitle && !matchTopic && !matchPattern && !matchDay) {
          return false;
        }
      }

      return true;
    });
  }, [days, selectedPhase, statusFilter, difficultyFilter, searchQuery, phases]);

  const toggleExpandDay = (dayNum: number) => {
    setExpandedDay((prev) => (prev === dayNum ? null : dayNum));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300 font-sans">
      {/* Public Top Header (Clean, Recruiter-Focused, No Internal Controls) */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  {student.name}
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Public Verified Study Portfolio
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {student.university} &bull; <span className="text-emerald-400 font-semibold">{student.targetRole}</span>
              </p>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center gap-2 text-xs">
            <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Oct 14, 2026 – Apr 11, 2027</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-emerald-300 font-semibold">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>540 Target Study Hours</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-28">
        {/* Candidate Profile Summary Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/25 p-6 sm:p-8 shadow-2xl">
          <div className="absolute right-0 top-0 -mt-16 -mr-16 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>180-Day Software Engineering Immersion &bull; Daily Time Log & Problem Mastery</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {student.name}'s Daily Study Log & Problem Showcase
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              An audited, transparent record tracking 3 hours of daily deep-work, LeetCode algorithmic patterns,
              CS fundamentals, Java DSA implementation, and backend systems preparation for Summer 2027 SWE internships.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 font-medium">
                🏫 {student.university}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-medium">
                🎯 {student.targetRole}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                🛂 {student.visaStatus}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium">
                ⏱️ Target: 3.0h / Day &bull; 21h / Week
              </span>
            </div>
          </div>
        </section>

        {/* TODAY'S PROBLEM SOLVED & DEEP-WORK LOG (Featured Premier Card) */}
        {todayDay && (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Problem Solved Today & Daily Study Log
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                      Program Day {todayDay.dayNumber} of 180
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {todayDay.anchorProblem || todayDay.topic}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-medium px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
                  📅 {todayDay.displayDate}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    todayDay.anchorDifficulty === "Easy"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : todayDay.anchorDifficulty === "Hard"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {todayDay.anchorDifficulty || "Medium"}
                </span>
                {todayDay.anchorPattern && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    Pattern: {todayDay.anchorPattern}
                  </span>
                )}
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    todayDay.status === "Completed"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : todayDay.status === "In Progress"
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {todayDay.status}
                </span>
              </div>
            </div>

            {/* Side-by-side details: Left is problem breakdown, Right is time spent log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
              {/* Left 2 Cols: Problem Invariant & Strategy */}
              <div className="lg:col-span-2 space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Topic & Core Invariant
                  </span>
                  <p className="text-sm text-slate-200 font-medium">
                    <strong className="text-emerald-400">{todayDay.phase}:</strong> {todayDay.topic}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed pt-1">
                    {todayDay.learningObjective}
                  </p>
                </div>

                {todayDay.anchorInstructions && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
                      Algorithmic Approach & Key Decision Rule
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {todayDay.anchorInstructions}
                    </p>
                  </div>
                )}

                {todayDay.deliverable && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex flex-wrap items-baseline gap-2">
                    <strong className="text-emerald-400 font-bold shrink-0">Exit Deliverable:</strong>
                    <span className="text-slate-300">{todayDay.deliverable}</span>
                  </div>
                )}
              </div>

              {/* Right Col: Today's Time Log */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Time Logged Today
                    </span>
                    <button
                      onClick={() => setSessionModalDay(todayDay)}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition"
                      title="Open full detailed start & end time audit modal"
                    >
                      <Activity className="w-3 h-3" />
                      <span>Audit Breakdown</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-extrabold font-mono text-white">
                      {todayDay.actualHours}h
                    </span>
                    <span className="text-xs text-slate-400">
                      / {todayDay.plannedHours}h Planned Target
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-500 ${
                        todayDay.actualMinutes >= 180 ? "bg-emerald-500" : todayDay.actualMinutes > 0 ? "bg-indigo-500" : "bg-slate-700"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((todayDay.actualMinutes / (todayDay.totalPlannedMinutes || 180)) * 100)
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{todayDay.actualMinutes} min logged</span>
                    <span
                      className={`font-bold ${
                        todayDay.actualMinutes >= 180 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {todayDay.actualMinutes >= 180
                        ? "✓ 3h Target Met!"
                        : `${Math.round((todayDay.actualMinutes / (todayDay.totalPlannedMinutes || 180)) * 100)}% Target`}
                    </span>
                  </div>
                </div>

                {/* Session Start/End Time vs Tasks Toggle */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
                    <button
                      onClick={() => setTodayTimeViewMode("sessions")}
                      className={`flex-1 py-1 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        todayTimeViewMode === "sessions"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>Start & End Times ({(todayDay.sessions || []).length})</span>
                    </button>
                    <button
                      onClick={() => setTodayTimeViewMode("tasks")}
                      className={`flex-1 py-1 px-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        todayTimeViewMode === "tasks"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Tasks ({todayDay.completedTasksCount}/{todayDay.totalTasksCount})</span>
                    </button>
                  </div>

                  {/* Mode 1: Start Time & End Time Breakdown */}
                  {todayTimeViewMode === "sessions" && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(todayDay.sessions || []).length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-1">
                          <Clock className="w-5 h-5 text-slate-500 mx-auto" />
                          <p className="text-xs text-slate-300 font-medium">No study sessions recorded yet today</p>
                          <p className="text-[11px] text-slate-500">
                            Every minute spent running the timer or checking off tasks is audited here with start & end timestamps.
                          </p>
                        </div>
                      ) : (
                        (todayDay.sessions || []).map((session, sIdx) => (
                          <div
                            key={session.id || sIdx}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white flex items-center gap-1.5 font-mono text-[11px]">
                                <Clock className="w-3 h-3 text-indigo-400" />
                                {session.displayTimeRange}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                {session.durationMinutes}m ({session.durationHours}h)
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 font-medium truncate">
                              {session.taskTitle}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                              <span className="text-indigo-300">{session.category}</span>
                              <span className="text-slate-400">{session.status}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Mode 2: Tasks Breakdown */}
                  {todayTimeViewMode === "tasks" && (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {todayDay.tasks.map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-slate-300 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                          <span className="truncate pr-2">{t.title}</span>
                          <span className="font-mono text-slate-400 shrink-0">
                            {t.actualMinutes}m / {t.plannedMinutes}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4 High-Level Progress KPI Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Time Spent */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Time Logged</span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {stats ? stats.actualHours : "0.0"}h
              </span>
              <span className="text-xs text-slate-400">/ 540h Total Planned</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, ((stats?.actualMinutes || 0) / (540 * 60)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>Target: 3.0h / day (21h / wk)</span>
              <span className="text-emerald-400 font-bold">
                {Math.round(((stats?.actualMinutes || 0) / (540 * 60)) * 100)}%
              </span>
            </div>
          </div>

          {/* Anchor Problems Solved */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Problems Solved</span>
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Code2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {stats ? stats.problemsSolvedCount : 0}
              </span>
              <span className="text-xs text-slate-400">/ 180 Anchor Problems</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Easy: {stats?.easyProblemsCount || 0}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Med: {stats?.mediumProblemsCount || 0}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Hard: {stats?.hardProblemsCount || 0}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Each problem backed by pattern analysis & cold re-solve.
            </p>
          </div>

          {/* Days Completed */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Curriculum Days</span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {stats ? stats.completedDays : 0}
              </span>
              <span className="text-xs text-slate-400">/ 180 Days Completed</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round(((stats?.completedDays || 0) / 180) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>In Progress: {stats?.inProgressDays || 0} days</span>
              <span className="text-amber-400 font-bold">
                {Math.round(((stats?.completedDays || 0) / 180) * 100)}% Complete
              </span>
            </div>
          </div>

          {/* 3h Daily Target Consistency Rate */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">3h Daily Target Adherence</span>
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-extrabold font-mono text-white">
                {stats ? stats.consistencyRate : 100}%
              </span>
              <span className="text-xs text-slate-400">Target Consistency</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              {stats?.daysMeetingTarget || 0} active days met or exceeded the strict 180-minute deep-work target.
            </p>
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> F-1 CPT / OPT Summer 2027 Discipline Standard
            </div>
          </div>
        </section>

        {/* Phase-by-Phase Interactive Breakdown */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Curriculum Phases (180-Day Roadmap)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Click any phase card to instantly filter the daily study logs and solved problems below.
              </p>
            </div>
            {selectedPhase !== "all" && (
              <button
                onClick={() => setSelectedPhase("all")}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800"
              >
                <span>Clear Phase Filter (Show All 180 Days)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {phases.map((phase) => {
              const isSelected = selectedPhase === phase.id;
              return (
                <div
                  key={phase.id}
                  onClick={() => setSelectedPhase(isSelected ? "all" : phase.id)}
                  className={`rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? "bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500"
                      : "bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      Phase {phase.id}: {phase.days}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {phase.percent}%
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white mb-2 line-clamp-1">
                    {phase.name}
                  </h3>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${phase.percent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 border-t border-slate-800/80">
                    <div>
                      <div className="text-slate-400">Days</div>
                      <div className="font-bold text-slate-200">
                        {phase.completedDays} / 30
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Hours</div>
                      <div className="font-bold text-emerald-400">
                        {phase.actualHours}h
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Problems</div>
                      <div className="font-bold text-indigo-300">
                        {phase.problemsSolved}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Daily Time Log & Problem Solved Feed */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span>Daily Time Log & Problem Solved Log (All 180 Days)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Audited timeline of hours studied per day, anchor problem solved, algorithmic pattern, and task breakdown.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search box */}
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search problem, pattern, day..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Days</option>
                <option value="completed">Completed Days</option>
                <option value="in-progress">In Progress</option>
                <option value="logged">Days With Time Logged</option>
              </select>

              {/* Difficulty Filter */}
              <select
                value={difficultyFilter}
                onChange={(e: any) => setDifficultyFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy Problems</option>
                <option value="Medium">Medium Problems</option>
                <option value="Hard">Hard Problems</option>
              </select>
            </div>
          </div>

          {/* Results count & active filter summary */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{filteredDays.length}</strong> of 180 Days
              {selectedPhase !== "all" && ` • Phase ${selectedPhase}`}
              {statusFilter !== "all" && ` • ${statusFilter}`}
              {difficultyFilter !== "all" && ` • ${difficultyFilter}`}
              {searchQuery && ` • matching "${searchQuery}"`}
            </span>
            {(selectedPhase !== "all" || statusFilter !== "all" || difficultyFilter !== "all" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedPhase("all");
                  setStatusFilter("all");
                  setDifficultyFilter("all");
                  setSearchQuery("");
                }}
                className="text-emerald-400 hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Day Cards List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-sm font-medium">Loading verified study history & daily logs...</span>
            </div>
          ) : filteredDays.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 p-8 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No matching days found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No study day matches your current search or filter criteria. Try adjusting your query or resetting filters.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDays.map((day) => {
                const isExpanded = expandedDay === day.dayNumber;
                const difficultyColor =
                  day.anchorDifficulty === "Easy"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : day.anchorDifficulty === "Hard"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20";

                const isTargetMet = day.actualMinutes >= 180;
                const timePercent = Math.min(100, Math.round((day.actualMinutes / (day.totalPlannedMinutes || 180)) * 100));

                return (
                  <div
                    key={day.dayNumber}
                    className={`rounded-2xl border transition-all ${
                      day.status === "Completed"
                        ? "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                        : day.actualMinutes > 0
                        ? "bg-slate-900/80 border-indigo-500/30"
                        : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    {/* Primary Row Header */}
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Day Badge & Problem Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white">
                            Day {day.dayNumber}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {day.displayDate}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {day.phase}
                          </span>
                        </div>

                        {/* Anchor Problem Title & Pattern */}
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h3 className="text-base font-bold text-white">
                            {day.anchorProblem || day.topic}
                          </h3>
                          {day.anchorDifficulty && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${difficultyColor}`}>
                              {day.anchorDifficulty}
                            </span>
                          )}
                          {day.anchorPattern && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              Pattern: {day.anchorPattern}
                            </span>
                          )}
                        </div>

                        {/* Topic & Learning Invariant */}
                        <p className="text-xs text-slate-300 line-clamp-2">
                          <strong className="text-slate-400 font-semibold">Topic:</strong> {day.topic} &bull;{" "}
                          <span className="text-slate-400">{day.learningObjective}</span>
                        </p>
                      </div>

                      {/* Right: Daily Time Spent Log & Status Badges */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 lg:gap-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800/80 shrink-0">
                        {/* Time Spent Pill */}
                        <div className="flex flex-col sm:items-end min-w-[130px]">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-extrabold text-sm text-white font-mono">
                              {day.actualHours}h
                            </span>
                            <span className="text-slate-400">/ {day.plannedHours}h</span>
                          </div>

                          {/* Time Progress Bar */}
                          <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isTargetMet ? "bg-emerald-500" : day.actualMinutes > 0 ? "bg-indigo-500" : "bg-slate-700"
                              }`}
                              style={{ width: `${timePercent}%` }}
                            />
                          </div>

                          <span className="text-[10px] text-slate-400 mt-1">
                            {isTargetMet ? (
                              <span className="text-emerald-400 font-bold">✓ 3h Target Met</span>
                            ) : day.actualMinutes > 0 ? (
                              <span className="text-amber-400 font-medium">{day.actualMinutes}m logged</span>
                            ) : (
                              <span>0m logged</span>
                            )}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-col items-center">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                              day.status === "Completed"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : day.status === "In Progress"
                                ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {day.status}
                          </span>
                        </div>

                        {/* Expand / Details Toggle Button */}
                        <button
                          onClick={() => toggleExpandDay(day.dayNumber)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                          aria-label="Toggle day task breakdown"
                        >
                          <span>{isExpanded ? "Hide" : "Details"}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Task & Session Breakdown */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/80 bg-slate-950/40 rounded-b-2xl space-y-4">
                        {/* Anchor Instructions & Deliverables */}
                        {day.anchorInstructions && (
                          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                            <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
                              Problem Details & Instructions
                            </span>
                            <p className="text-slate-300 leading-relaxed">
                              {day.anchorInstructions}
                            </p>
                          </div>
                        )}

                        {day.deliverable && (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                            <strong className="text-emerald-400">Deliverable:</strong>
                            <span>{day.deliverable}</span>
                          </div>
                        )}

                        {/* Start & End Time Sessions List */}
                        <div className="space-y-2 pt-1 border-t border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Session Time Log (Start & End Times)</span>
                            </span>
                            <button
                              onClick={() => setSessionModalDay(day)}
                              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/20 transition"
                            >
                              <span>Full Day Audit</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(day.sessions || []).length === 0 ? (
                              <div className="col-span-full p-3 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center">
                                <span className="text-xs text-slate-500">No study sessions recorded for this day (0m logged).</span>
                              </div>
                            ) : (
                              (day.sessions || []).map((sess, sIdx) => (
                                <div
                                  key={sess.id || sIdx}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                                >
                                  <div className="space-y-0.5 min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-white text-[11px]">
                                        {sess.displayTimeRange}
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400">
                                        {sess.durationMinutes}m
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 truncate">
                                      {sess.taskTitle}
                                    </p>
                                  </div>
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    {sess.status}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Sub-Tasks Time Allocation List */}
                        <div className="space-y-2 pt-1 border-t border-slate-800/80">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Daily Task Breakdown ({day.completedTasksCount} / {day.totalTasksCount} Completed)
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {day.tasks.map((task, tIdx) => (
                              <div
                                key={tIdx}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  <div
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      task.status === "Completed"
                                        ? "bg-emerald-400"
                                        : task.actualMinutes > 0
                                        ? "bg-indigo-400"
                                        : "bg-slate-600"
                                    }`}
                                  />
                                  <span className="font-medium text-slate-200 truncate">
                                    {task.title}
                                  </span>
                                  {task.isAnchor && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                      Anchor
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 text-slate-400 font-mono">
                                  <span>{task.actualMinutes}m / {task.plannedMinutes}m</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      task.status === "Completed"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-slate-800 text-slate-400"
                                    }`}
                                  >
                                    {task.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Detailed Session Start & End Time Audit Modal */}
        {sessionModalDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Day {sessionModalDay.dayNumber} Audit
                    </span>
                    <span className="text-xs text-slate-400">{sessionModalDay.displayDate}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    Detailed Time Log & Study Session Breakdown
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Start time and end time audit records for all study blocks completed on this day.
                  </p>
                </div>

                <button
                  onClick={() => setSessionModalDay(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Time Summary Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Total Logged</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {sessionModalDay.actualHours}h
                  </div>
                  <div className="text-[10px] text-slate-500">{sessionModalDay.actualMinutes} minutes</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Daily Target</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {sessionModalDay.plannedHours}h
                  </div>
                  <div className="text-[10px] text-slate-500">180 min commitment</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Target Status</div>
                  <div className={`text-sm font-bold mt-2 ${sessionModalDay.isTargetMet ? "text-emerald-400" : "text-amber-400"}`}>
                    {sessionModalDay.isTargetMet ? "✓ 3h Target Met" : "In Progress"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {Math.round((sessionModalDay.actualMinutes / (sessionModalDay.totalPlannedMinutes || 180)) * 100)}%
                  </div>
                </div>
              </div>

              {/* Timeline of Start Time & End Time Sessions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Session Timeline Breakdown</span>
                  <span className="text-indigo-400 font-mono">{(sessionModalDay.sessions || []).length} Study Blocks</span>
                </h4>

                <div className="space-y-3">
                  {(sessionModalDay.sessions || []).length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                      <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-sm font-semibold text-slate-300">No study sessions recorded for Day {sessionModalDay.dayNumber}</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        This day currently has 0 minutes of verified study time. Once the focus timer runs or tasks are checked off, audited sessions will appear here.
                      </p>
                    </div>
                  ) : (
                    (sessionModalDay.sessions || []).map((session, sIdx) => (
                      <div
                        key={session.id || sIdx}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 relative overflow-hidden"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center">
                              {sIdx + 1}
                            </span>
                            <span className="font-extrabold text-sm font-mono text-white">
                              {session.displayTimeRange}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {session.durationMinutes} min ({session.durationHours} hrs)
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                              {session.status}
                            </span>
                          </div>
                        </div>

                        <div className="pt-1">
                          <div className="text-xs font-bold text-slate-200">
                            {session.taskTitle}
                          </div>
                          <div className="text-[11px] text-indigo-300/80 mt-0.5">
                            Category: {session.category}
                          </div>
                          {session.notes && (
                            <p className="text-xs text-slate-400 mt-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                              {session.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSessionModalDay(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Public Footer */}
        <footer className="pt-8 border-t border-slate-800 text-center space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span>Student: <strong className="text-slate-200">{student.name}</strong></span>
            <span>&bull;</span>
            <span>University: <strong className="text-slate-200">{student.university}</strong></span>
            <span>&bull;</span>
            <span>Visa Status: <strong className="text-emerald-400">{student.visaStatus}</strong></span>
            <span>&bull;</span>
            <span>Target: <strong className="text-indigo-400">{student.targetRole}</strong></span>
          </div>
          <p className="text-[11px] text-slate-500">
            180-Day Software Engineering Interview Preparation Handbook & Study Tracker &bull; Deployed on Dockyard
          </p>
        </footer>
      </main>
    </div>
  );
}
