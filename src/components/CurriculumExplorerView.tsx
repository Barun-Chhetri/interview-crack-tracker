"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Search,
  Layers,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";

interface CurriculumExplorerViewProps {
  onSelectDay: (dayNumber: number) => void;
  onNavigateTab: (tab: string) => void;
}

export function CurriculumExplorerView({
  onSelectDay,
  onNavigateTab,
}: CurriculumExplorerViewProps) {
  const [days, setDays] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadCurriculum() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/days?limit=180");
        if (res.ok) {
          const data = await res.json();
          setDays(data.days || []);
        }
      } catch (err) {
        console.error("Failed to load curriculum:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCurriculum();
  }, []);

  const phases = [
    "Java Foundations & Essential DSA",
    "Core Interview Patterns",
    "Advanced Algorithms",
    "CS Fundamentals & System Design",
    "Backend Project & Recruiting",
    "Final Mock Interviews & Readiness",
  ];

  const filteredDays = days.filter((d) => {
    const matchesSearch =
      d.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.anchorProblem && d.anchorProblem.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(d.dayNumber).includes(searchQuery);

    const matchesPhase = selectedPhase === "all" || d.phase === selectedPhase;
    const matchesWeek = selectedWeek === "all" || String(d.weekNumber) === selectedWeek;

    return matchesSearch && matchesPhase && matchesWeek;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Handbook Curriculum Directory
              </span>
              <span className="text-xs text-slate-400">180 Days &bull; 900 Scheduled Tasks</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              All 180 Days Study Curriculum
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Extracted directly from your 180-Day Software Engineering Interview Preparation Handbook. Every day features an exact 180-minute schedule, anchor challenge, and deliverables.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl px-5 py-3 text-right">
            <span className="text-xs text-slate-400 font-semibold uppercase">Showing</span>
            <div className="text-2xl font-mono font-bold text-indigo-400">
              {filteredDays.length} / 180
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topic, anchor problem (e.g. 'Word Search', 'HashMap')..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Phase Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-semibold hidden sm:inline">Phase:</label>
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
          >
            <option value="all">All 6 Phases</option>
            {phases.map((p, idx) => (
              <option key={p} value={p}>
                Phase {idx + 1}: {p}
              </option>
            ))}
          </select>
        </div>

        {/* Week Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-semibold hidden sm:inline">Week:</label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
          >
            <option value="all">All 26 Weeks</option>
            {Array.from({ length: 26 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={String(w)}>
                Week {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading curriculum...</div>
        ) : filteredDays.length > 0 ? (
          filteredDays.map((d) => (
            <div
              key={d.dayNumber}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Day {d.dayNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Week {d.weekNumber} &bull; {d.date}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      {d.phase}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{d.topic}</h3>

                  {d.anchorProblem && (
                    <p className="text-xs text-amber-300 font-medium">
                      Anchor Problem: <strong>{d.anchorProblem}</strong> ({d.anchorDifficulty || "Medium"})
                    </p>
                  )}

                  {/* Tasks count preview */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span>{d.tasks?.length || 5} tasks</span>
                    <span>&bull;</span>
                    <span>{d.totalPlannedMinutes} min planned</span>
                    {d.actualMinutes > 0 && (
                      <>
                        <span>&bull;</span>
                        <span className="text-emerald-400 font-semibold">
                          {d.actualMinutes}m completed
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onSelectDay(d.dayNumber);
                      onNavigateTab("checklist");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    Open Checklist <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
            No days match your current filter or search query.
          </div>
        )}
      </div>
    </div>
  );
}
