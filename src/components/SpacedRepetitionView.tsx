"use client";

import React, { useState, useEffect } from "react";
import { SpacedReviewDTO, ReviewResultType } from "@/lib/types";
import {
  Repeat,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  BookOpen,
  Filter,
  Check,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

interface SpacedRepetitionViewProps {
  currentDate: string;
  onRefreshData: () => void;
}

export function SpacedRepetitionView({ currentDate, onRefreshData }: SpacedRepetitionViewProps) {
  const [filter, setFilter] = useState<"dueToday" | "overdue" | "upcoming" | "completed">("dueToday");
  const [reviews, setReviews] = useState<SpacedReviewDTO[]>([]);
  const [counts, setCounts] = useState<{ dueToday: number; overdue: number; completed: number }>({
    dueToday: 0,
    overdue: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeReviewModal, setActiveReviewModal] = useState<SpacedReviewDTO | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reviews?filter=${filter}&date=${currentDate}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter, currentDate]);

  const handleLogResult = async (reviewId: string, result: ReviewResultType) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          result,
          notes: reviewNotes,
          currentDate,
        }),
      });

      if (res.ok) {
        setActiveReviewModal(null);
        setReviewNotes("");
        fetchReviews();
        onRefreshData();
      }
    } catch (err) {
      console.error("Failed to log review result:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Spaced-Repetition System
              </span>
              <span className="text-xs text-slate-400">
                R0 &bull; R1 (+1d) &bull; R3 (+3d) &bull; R7 (+7d) &bull; R14 (+14d) &bull; R30 (+30d) &bull; R60 (+60d)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Spaced-Repetition Ledger & Active Recall
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              All review dates are calculated strictly from the original learning date. Marking "Needs Practice" or "Relearn" automatically schedules a next-day repair attempt without altering your anchor schedule.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-3 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase">Due Today</span>
              <div className="text-2xl font-mono font-bold text-emerald-400">{counts.dueToday}</div>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-3 text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase">Overdue</span>
              <div className="text-2xl font-mono font-bold text-rose-400">{counts.overdue}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Review Protocol Guide */}
      <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-5 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          5–7 Minute Anchor Review Protocol (From Handbook Section 3)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 text-xs text-slate-300">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <strong className="text-indigo-300 block mb-1">1. Cold Recall:</strong>
            State trigger conditions and pattern invariant without opening notes.
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <strong className="text-indigo-300 block mb-1">2. Blank Re-Solve:</strong>
            Re-solve the anchor problem from scratch or explain line-by-line.
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <strong className="text-indigo-300 block mb-1">3. Complexity Proof:</strong>
            State explicit time & space Big-O and test 2 boundary edge cases.
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <strong className="text-indigo-300 block mb-1">4. Error Reflection:</strong>
            Identify what caused previous mistakes and how you now prevent them.
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <strong className="text-indigo-300 block mb-1">5. Log Mastery:</strong>
            Mark Strong, Needs Practice, or Relearn for next-day queueing.
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {(
          [
            { id: "dueToday", label: `Due Today (${counts.dueToday})` },
            { id: "overdue", label: `Overdue (${counts.overdue})` },
            { id: "upcoming", label: "Upcoming Reviews" },
            { id: "completed", label: `Completed Ledger (${counts.completed})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === tab.id
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length > 0 ? (
          reviews.map((rev) => {
            const isCompleted = rev.status === "Completed";
            return (
              <div
                key={rev.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCompleted
                    ? "bg-slate-950/40 border-slate-800/80 opacity-80"
                    : rev.dueDate < currentDate
                    ? "bg-rose-950/20 border-rose-500/40"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {rev.intervalName}
                      </span>
                      <h4 className="text-sm font-bold text-white">{rev.anchorTitle}</h4>
                      {rev.pattern && (
                        <span className="text-xs text-slate-400">({rev.pattern})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>Original Learned: {rev.originalDate}</span>
                      <span>&bull;</span>
                      <span>Due Date: {rev.dueDate}</span>
                    </div>
                    {rev.notes && (
                      <p className="text-xs text-amber-300/80 italic mt-1 bg-slate-950/40 px-2 py-0.5 rounded">
                        Notes: {rev.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold ${
                          rev.result === "Strong"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : rev.result === "Needs Practice"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        Result: {rev.result}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLogResult(rev.id, "Strong")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Strong
                        </button>
                        <button
                          onClick={() => handleLogResult(rev.id, "Needs Practice")}
                          className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Needs Practice (+Repair)
                        </button>
                        <button
                          onClick={() => handleLogResult(rev.id, "Relearn")}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Relearn (+Repair)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No spaced reviews in this queue.</p>
            <p className="text-xs text-slate-500 mt-1">Keep up your daily anchor problem attempts to populate future intervals.</p>
          </div>
        )}
      </div>
    </div>
  );
}
