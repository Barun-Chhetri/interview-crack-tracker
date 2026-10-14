"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
} from "lucide-react";

interface CalendarViewProps {
  onSelectDay: (dayNumber: number) => void;
  onNavigateTab: (tab: string) => void;
}

interface CalendarDaySummary {
  dayNumber: number;
  date: string;
  dayOfWeek: string;
  topic: string;
  anchorProblem?: string | null;
  phase: string;
  totalPlannedMinutes: number;
  actualMinutes: number;
  status: string;
}

export function CalendarView({ onSelectDay, onNavigateTab }: CalendarViewProps) {
  const [allDays, setAllDays] = useState<CalendarDaySummary[]>([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Program months: Oct 2026 to Apr 2027
  const programMonths = [
    { label: "October 2026", year: 2026, month: 9, startDayNum: 1 },
    { label: "November 2026", year: 2026, month: 10, startDayNum: 19 },
    { label: "December 2026", year: 2026, month: 11, startDayNum: 49 },
    { label: "January 2027", year: 2027, month: 0, startDayNum: 80 },
    { label: "February 2027", year: 2027, month: 1, startDayNum: 111 },
    { label: "March 2027", year: 2027, month: 2, startDayNum: 139 },
    { label: "April 2027", year: 2027, month: 3, startDayNum: 170 },
  ];

  useEffect(() => {
    async function loadAllDays() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/days?limit=180");
        if (res.ok) {
          const data = await res.json();
          setAllDays(data.days || []);
        }
      } catch (err) {
        console.error("Failed to load calendar days:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAllDays();
  }, []);

  const currentMonth = programMonths[currentMonthIndex];

  // Filter days belonging to this month
  const monthDays = allDays.filter((d) => {
    const dt = new Date(d.date + "T00:00:00");
    return dt.getFullYear() === currentMonth.year && dt.getMonth() === currentMonth.month;
  });

  return (
    <div className="space-y-6">
      {/* Month Navigation Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              180-Day Program Calendar
            </span>
            <span className="text-xs text-slate-400">
              Oct 14, 2026 &ndash; Apr 11, 2027
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">{currentMonth.label}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonthIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentMonthIndex === 0}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-xs font-semibold text-slate-400 px-2">
            Month {currentMonthIndex + 1} of {programMonths.length}
          </span>

          <button
            onClick={() => setCurrentMonthIndex((prev) => Math.min(programMonths.length - 1, prev + 1))}
            disabled={currentMonthIndex === programMonths.length - 1}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 7-Month Quick Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {programMonths.map((m, idx) => (
          <button
            key={m.label}
            onClick={() => setCurrentMonthIndex(idx)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              idx === currentMonthIndex
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {monthDays.map((d) => {
          const isDone = d.status === "Completed" || d.actualMinutes >= 180;
          const isInProgress = d.actualMinutes > 0 && !isDone;

          return (
            <div
              key={d.dayNumber}
              onClick={() => {
                onSelectDay(d.dayNumber);
                onNavigateTab("checklist");
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isDone
                  ? "bg-slate-900/60 border-emerald-500/30 hover:border-emerald-400 shadow-sm"
                  : isInProgress
                  ? "bg-indigo-950/20 border-indigo-500/40 hover:border-indigo-400"
                  : "bg-slate-900 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                    Day {d.dayNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-300"
                        : isInProgress
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isDone ? "Done" : isInProgress ? "In Progress" : "Scheduled"}
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-mono mb-1">{d.date}</div>
                <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">{d.topic}</h4>
                {d.anchorProblem && (
                  <p className="text-xs text-emerald-400/90 font-medium truncate mb-2">
                    Anchor: {d.anchorProblem}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">
                  {d.actualMinutes}m / {d.totalPlannedMinutes}m
                </span>
                <span className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  Checklist &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
