"use client";

import React, { useState } from "react";
import { useTimer } from "@/lib/timer-context";
import { Play, Pause, Square, RotateCcw, Clock, CheckCircle2, FileText } from "lucide-react";

export function TimerFloatingBar({ onSessionSaved }: { onSessionSaved?: () => void }) {
  const { timer, formattedTime, elapsedSeconds, pauseTimer, resumeTimer, stopTimer, resetTimer } = useTimer();
  const [showStopModal, setShowStopModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!timer.isRunning && timer.accumulatedSeconds === 0) {
    return null;
  }

  const handleStopClick = () => {
    setShowStopModal(true);
  };

  const handleConfirmStop = async () => {
    setIsSubmitting(true);
    await stopTimer(sessionNotes);
    setIsSubmitting(false);
    setShowStopModal(false);
    setSessionNotes("");
    if (onSessionSaved) onSessionSaved();
  };

  const handleResetClick = () => {
    if (confirm("Are you sure you want to discard this study timer without saving?")) {
      resetTimer();
    }
  };

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl">
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 shadow-2xl rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 ring-1 ring-white/10">
          {/* Task Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-3 h-3 rounded-full ${timer.isPaused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Day {timer.dayNumber || 1}
                </span>
                <span className="text-xs text-slate-400 truncate max-w-[140px] sm:max-w-xs">
                  {timer.taskCategory || "Study Session"}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-100 truncate max-w-[220px] sm:max-w-md">
                {timer.taskTitle || "Active Study"}
              </p>
            </div>
          </div>

          {/* Timer Display & Controls */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right">
              <div className="text-2xl font-mono font-bold tracking-tight text-emerald-400">
                {formattedTime}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {timer.isPaused ? "Paused" : "Recording Active Time"}
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
              {timer.isPaused ? (
                <button
                  onClick={resumeTimer}
                  title="Resume Study Timer"
                  className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-sm"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  title="Pause Study Timer"
                  className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer shadow-sm"
                >
                  <Pause className="w-4 h-4 fill-current" />
                </button>
              )}

              <button
                onClick={handleStopClick}
                title="Stop & Save Session"
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-sm"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={handleResetClick}
                title="Reset / Discard Timer"
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stop & Log Modal */}
      {showStopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Complete Study Session</h3>
                <p className="text-xs text-slate-400">Save active time to your daily checklist</p>
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Task:</span>
                <span className="font-medium text-slate-200 text-right truncate max-w-[240px]">
                  {timer.taskTitle}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Active Time Recorded:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {Math.round(elapsedSeconds / 60)} minutes ({formattedTime})
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Day:</span>
                <span className="text-slate-200">Day {timer.dayNumber}</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Session Notes & Mistakes Discovered (Optional)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="E.g., Invariant grasped; solved edge case with single element; struggled on boundary index."
                rows={3}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowStopModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Keep Studying
              </button>
              <button
                type="button"
                onClick={handleConfirmStop}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Session Time"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
