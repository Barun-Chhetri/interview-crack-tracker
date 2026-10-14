"use client";

import React from "react";
import { StudyDayDTO } from "@/lib/types";
import { useTimer } from "@/lib/timer-context";
import {
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Play,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Repeat,
  Layers,
  ExternalLink,
} from "lucide-react";

interface DashboardViewProps {
  currentDay: StudyDayDTO | null;
  curriculumOverview: {
    totalDays: number;
    completedDays: number;
    inProgressDays: number;
    totalTasks: number;
    completedTasks: number;
    totalReviews: number;
    completedReviews: number;
    plannedHours: number;
    actualHours: number;
    programProgressPercent: number;
    phases: Array<{
      name: string;
      days: string;
      range: number[];
      completedDays: number;
      totalDays: number;
      percent: number;
    }>;
  } | null;
  onNavigateTab: (tab: string) => void;
  onSelectDay: (dayNumber: number) => void;
  onRefreshData: () => void;
}

export function DashboardView({
  currentDay,
  curriculumOverview,
  onNavigateTab,
  onSelectDay,
  onRefreshData,
}: DashboardViewProps) {
  const { startTimer, timer } = useTimer();

  if (!currentDay) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Clock className="w-6 h-6 animate-spin mr-2" />
        Loading daily study plan...
      </div>
    );
  }

  const todayActualMinutes = currentDay.actualMinutes;
  const todayPlannedMinutes = currentDay.totalPlannedMinutes || 180;
  const todayRemainingMinutes = Math.max(0, todayPlannedMinutes - todayActualMinutes);
  const metDailyTarget = todayActualMinutes >= 180;

  const completedTasks = currentDay.tasks.filter((t) => t.status === "Completed");
  const inProgressTasks = currentDay.tasks.filter((t) => t.status === "In Progress" || t.status === "Partially Completed");
  const pendingTasks = currentDay.tasks.filter((t) => t.status === "Not Started");
  const carriedTasks = currentDay.tasks.filter((t) => t.isCarriedForward || t.status === "Carried Forward");

  const anchorTask = currentDay.tasks.find((t) => t.isAnchor) || currentDay.tasks[2];

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Day Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Program Day {currentDay.dayNumber} of 180 &bull; Week {currentDay.weekNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentDay.displayDate}
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              <strong className="text-emerald-400 font-semibold">{currentDay.phase}:</strong>{" "}
              {currentDay.topic}
            </p>
            <p className="text-xs text-slate-400 line-clamp-2">
              {currentDay.learningObjective}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab("checklist")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Open Daily Checklist
            </button>
            <button
              onClick={() => onNavigateTab("carryover")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              Carryover Planner
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Study Time */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Study Time</span>
            <div className={`p-2 rounded-xl ${metDailyTarget ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-400"}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold font-mono text-white">{(todayActualMinutes / 60).toFixed(1)}h</span>
            <span className="text-xs text-slate-400">/ {(todayPlannedMinutes / 60).toFixed(1)}h planned</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${metDailyTarget ? "bg-emerald-500" : "bg-indigo-500"}`}
              style={{ width: `${Math.min(100, (todayActualMinutes / todayPlannedMinutes) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Remaining: {todayRemainingMinutes} min</span>
            <span className={metDailyTarget ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              {metDailyTarget ? "3h Target Met!" : `${Math.round((todayActualMinutes / todayPlannedMinutes) * 100)}%`}
            </span>
          </div>
        </div>

        {/* Weekly Target vs Actual */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weekly Commitment</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold font-mono text-white">21.0h</span>
            <span className="text-xs text-slate-400">Target / Week</span>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            Minimum 3 hours per day across 7 days for Summer 2027 internship readiness.
          </p>
          <div className="text-[11px] text-indigo-300 font-semibold">
            Week {currentDay.weekNumber} of 26 weeks
          </div>
        </div>

        {/* Total Curriculum Progress */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Progress</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold font-mono text-white">
              {curriculumOverview?.completedDays || 0}
            </span>
            <span className="text-xs text-slate-400">/ 180 Days Done</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${((curriculumOverview?.completedDays || 0) / 180) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>{curriculumOverview?.completedTasks || 0} tasks finished</span>
            <span className="text-purple-400 font-bold">{curriculumOverview?.programProgressPercent || 0}%</span>
          </div>
        </div>

        {/* Spaced Repetition Due Today */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Spaced Reviews</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold font-mono text-white">
              {currentDay.reviewsDue?.length || 0}
            </span>
            <span className="text-xs text-slate-400">Due Today</span>
          </div>
          <p className="text-xs text-slate-400 mb-2 truncate">
            {currentDay.queueText || "Active recall & diagnostic review"}
          </p>
          <button
            onClick={() => onNavigateTab("spaced-rep")}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            Review Spaced Ledger <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Two Columns: Today's Tasks & Anchor Problem */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Checklist Quick View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Today's Daily Checklist</h2>
                <p className="text-xs text-slate-400">
                  {completedTasks.length} of {currentDay.tasks.length} tasks completed &bull; {todayRemainingMinutes} min remaining
                </p>
              </div>
              <button
                onClick={() => onNavigateTab("checklist")}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                Expand Full Checklist <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {currentDay.tasks.map((task) => {
                const isTimerActive = timer.isRunning && timer.taskId === task.id;
                const isTaskCompleted = task.status === "Completed";
                const isCarried = task.isCarriedForward || task.status === "Carried Forward";

                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isTaskCompleted
                        ? "bg-slate-900/40 border-slate-800/60 opacity-80"
                        : isTimerActive
                        ? "bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30"
                        : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 pr-2">
                      <div className="mt-0.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            task.priority === 1
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : task.priority === 2
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          }`}
                        >
                          P{task.priority}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isTaskCompleted ? "line-through text-slate-400" : "text-slate-100"}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md">
                          {task.instruction}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-mono font-semibold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                        {task.actualMinutes > 0 ? `${task.actualMinutes}m / ` : ""}
                        {task.plannedMinutes}m
                      </span>

                      {!isTaskCompleted && (
                        <button
                          onClick={() =>
                            startTimer({
                              id: task.id,
                              title: task.title,
                              category: task.category,
                              studyDayId: currentDay.id,
                              dayNumber: currentDay.dayNumber,
                            })
                          }
                          title="Start study timer for this task"
                          className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carryover Notice if any unfinished */}
            {todayRemainingMinutes > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    You have <strong>{todayRemainingMinutes} unfinished minutes</strong> today. Transfer the remainder to tomorrow without losing history.
                  </span>
                </div>
                <button
                  onClick={() => onNavigateTab("carryover")}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
                >
                  Review Carryover
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Today's Anchor Problem & Exit Deliverable */}
        <div className="space-y-4">
          {/* Anchor Problem Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Today's Anchor Problem
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  currentDay.anchorDifficulty === "Easy"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : currentDay.anchorDifficulty === "Hard"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {currentDay.anchorDifficulty || "Medium"}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                {currentDay.anchorProblem || "Daily Pattern Focus"}
              </h3>
              {currentDay.anchorPattern && (
                <p className="text-xs text-indigo-300 font-medium">
                  Pattern: {currentDay.anchorPattern}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {currentDay.anchorInstructions || "Attempt cold first with 25-minute timer before looking at hints."}
            </p>

            {currentDay.anchorProblem && (
              <a
                href={`https://leetcode.com/problems/${currentDay.anchorProblem.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}/`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                Open on LeetCode <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}
          </div>

          {/* Today's Deliverable / Exit Check */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Today's Deliverable & Exit Check</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentDay.deliverable || "Explain approach aloud; verify time/space complexity; test 2 edge cases."}
            </p>
            {currentDay.secondaryTask && (
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                <strong className="text-slate-300">Secondary:</strong> {currentDay.secondaryTask}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6-Month Phase Roadmap Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">180-Day Curriculum Phases</h2>
          </div>
          <span className="text-xs text-slate-400">
            6 Months &bull; October 14, 2026 to April 11, 2027
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {curriculumOverview?.phases?.map((p, idx) => {
            const isCurrentPhase = currentDay.dayNumber >= p.range[0] && currentDay.dayNumber <= p.range[1];
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrentPhase
                    ? "bg-indigo-950/30 border-indigo-500/40 ring-1 ring-indigo-500/20"
                    : "bg-slate-950/40 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {p.days}
                  </span>
                  {isCurrentPhase && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Current
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white mb-2">{p.name}</h4>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${p.percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{p.completedDays} of 30 days complete</span>
                  <span>{p.percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
