"use client";

import React, { useState } from "react";
import { StudyDayDTO, ScheduledTaskDTO, TaskStatus } from "@/lib/types";
import { useTimer } from "@/lib/timer-context";
import {
  CheckCircle2,
  Circle,
  Clock,
  Play,
  ArrowRightLeft,
  ExternalLink,
  Edit2,
  Save,
  Star,
  FileText,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  BookOpen,
} from "lucide-react";

interface TodayChecklistViewProps {
  currentDay: StudyDayDTO;
  onRefreshDay: () => void;
  onOpenCarryover: () => void;
}

export function TodayChecklistView({
  currentDay,
  onRefreshDay,
  onOpenCarryover,
}: TodayChecklistViewProps) {
  const { startTimer, timer, triggerConfetti } = useTimer();

  // Partial complete modal state
  const [partialModalTask, setPartialModalTask] = useState<ScheduledTaskDTO | null>(null);
  const [partialMinutes, setPartialMinutes] = useState<number>(30);

  // Edit task modal state
  const [editTask, setEditTask] = useState<ScheduledTaskDTO | null>(null);
  const [editMinutes, setEditMinutes] = useState<number>(30);
  const [editNotes, setEditNotes] = useState<string>("");

  // Day notes & confidence rating
  const [dayNotes, setDayNotes] = useState<string>(currentDay.notes || "");
  const [confidence, setConfidence] = useState<number>(currentDay.confidenceRating || 4);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);

  const totalPlanned = currentDay.totalPlannedMinutes || 180;
  const totalActual = currentDay.actualMinutes;
  const remaining = Math.max(0, totalPlanned - totalActual);
  const percentCompleted = Math.min(100, Math.round((totalActual / totalPlanned) * 100));

  // Group tasks by category
  const categories = Array.from(new Set(currentDay.tasks.map((t) => t.category)));

  const handleToggleComplete = async (task: ScheduledTaskDTO) => {
    const nextStatus: TaskStatus = task.status === "Completed" ? "Not Started" : "Completed";
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          actualMinutes: nextStatus === "Completed" ? task.plannedMinutes : 0,
        }),
      });

      if (res.ok) {
        if (nextStatus === "Completed") {
          triggerConfetti();
        }
        onRefreshDay();
      }
    } catch (err) {
      console.error("Failed to toggle task completion:", err);
    }
  };

  const handleSavePartial = async () => {
    if (!partialModalTask) return;
    try {
      const res = await fetch(`/api/tasks/${partialModalTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Partially Completed",
          actualMinutes: Number(partialMinutes),
        }),
      });

      if (res.ok) {
        setPartialModalTask(null);
        onRefreshDay();
      }
    } catch (err) {
      console.error("Failed to save partial completion:", err);
    }
  };

  const handleSaveTaskEdit = async () => {
    if (!editTask) return;
    try {
      const res = await fetch(`/api/tasks/${editTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plannedMinutes: Number(editMinutes),
          notes: editNotes,
        }),
      });

      if (res.ok) {
        setEditTask(null);
        onRefreshDay();
      }
    } catch (err) {
      console.error("Failed to edit task:", err);
    }
  };

  const handleSaveDayNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/days/${currentDay.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: dayNotes,
          confidenceRating: confidence,
        }),
      });

      if (res.ok) {
        setNotesSavedSuccess(true);
        setTimeout(() => setNotesSavedSuccess(false), 2500);
        onRefreshDay();
      }
    } catch (err) {
      console.error("Failed to update day notes:", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Day {currentDay.dayNumber} of 180
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Week {currentDay.weekNumber} &bull; {currentDay.phase}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {currentDay.displayDate}
            </h1>
          </div>

          <button
            onClick={onOpenCarryover}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Carry Unfinished Work to Tomorrow
          </button>
        </div>

        {/* Minutes Progress Bar & Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs text-slate-400 uppercase font-semibold">Planned Time</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {totalPlanned} min <span className="text-xs text-slate-400 font-normal">({(totalPlanned / 60).toFixed(1)}h)</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs text-emerald-400 uppercase font-semibold">Actual Studied</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {totalActual} min <span className="text-xs text-slate-400 font-normal">({(totalActual / 60).toFixed(1)}h)</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs text-amber-400 uppercase font-semibold">Remaining Planned</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {remaining} min <span className="text-xs text-slate-400 font-normal">({(remaining / 60).toFixed(1)}h)</span>
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              totalActual >= 180 ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-emerald-400"
            }`}
            style={{ width: `${percentCompleted}%` }}
          />
        </div>
      </div>

      {/* Focus Topic & Anchor Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="text-xs font-bold uppercase text-indigo-400">Today's Topic</div>
          <h3 className="text-base font-bold text-white">{currentDay.topic}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{currentDay.learningObjective}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-400">Anchor Problem</span>
            {currentDay.anchorDifficulty && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {currentDay.anchorDifficulty}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-white">{currentDay.anchorProblem || "Daily Coding Practice"}</h3>
          <p className="text-xs text-slate-400 line-clamp-2">{currentDay.anchorInstructions}</p>
        </div>
      </div>

      {/* Categories & Tasks Checklist */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryTasks = currentDay.tasks.filter((t) => t.category === category);
          const catPlanned = categoryTasks.reduce((sum, t) => sum + t.plannedMinutes, 0);
          const catActual = categoryTasks.reduce((sum, t) => sum + t.actualMinutes, 0);

          return (
            <div key={category} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h3 className="text-base font-bold text-white">{category}</h3>
                  <span className="text-xs text-slate-400">({categoryTasks.length} tasks)</span>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-400">
                  {catActual}m / {catPlanned}m
                </span>
              </div>

              <div className="space-y-3">
                {categoryTasks.map((task) => {
                  const isCompleted = task.status === "Completed";
                  const isPartial = task.status === "Partially Completed";
                  const isTimerRunningOnTask = timer.isRunning && timer.taskId === task.id;
                  const isCarried = task.isCarriedForward || task.status === "Carried Forward";

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCompleted
                          ? "bg-slate-950/40 border-slate-800/60 opacity-80"
                          : isTimerRunningOnTask
                          ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40"
                          : isPartial
                          ? "bg-amber-950/20 border-amber-500/30"
                          : "bg-slate-800/40 border-slate-700/80 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-[260px]">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(task)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                            title={isCompleted ? "Mark uncompleted" : "Mark completed"}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                            )}
                          </button>

                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  task.priority === 1
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                    : task.priority === 2
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                }`}
                              >
                                P{task.priority}
                              </span>

                              {isCarried && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Carried Forward
                                </span>
                              )}

                              {isPartial && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  Partially Completed
                                </span>
                              )}

                              <h4
                                className={`text-sm font-semibold ${
                                  isCompleted ? "line-through text-slate-400" : "text-white"
                                }`}
                              >
                                {task.title}
                              </h4>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">
                              {task.instruction}
                            </p>

                            {task.notes && (
                              <p className="text-xs text-amber-300/90 italic bg-slate-950/40 px-2 py-1 rounded">
                                Notes: {task.notes}
                              </p>
                            )}

                            {task.resourceUrl && (
                              <a
                                href={task.resourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 pt-1"
                              >
                                Problem Resource Link <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Actions & Timers */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right text-xs">
                            <span className="font-mono font-bold text-slate-200">
                              {task.actualMinutes > 0 ? `${task.actualMinutes}m / ` : ""}
                              {task.plannedMinutes}m
                            </span>
                            {task.remainingMinutes > 0 && !isCompleted && (
                              <div className="text-[10px] text-amber-400 font-semibold">
                                {task.remainingMinutes}m remaining
                              </div>
                            )}
                          </div>

                          {/* Start Timer */}
                          {!isCompleted && (
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
                              title="Start timer for this task"
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                isTimerRunningOnTask
                                  ? "bg-indigo-600 text-white border-indigo-400"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                              }`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}

                          {/* Partial Complete Button */}
                          {!isCompleted && (
                            <button
                              onClick={() => {
                                setPartialModalTask(task);
                                setPartialMinutes(task.actualMinutes || Math.floor(task.plannedMinutes / 2));
                              }}
                              title="Log partial completion"
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                            >
                              Partial
                            </button>
                          )}

                          {/* Edit Duration / Notes */}
                          <button
                            onClick={() => {
                              setEditTask(task);
                              setEditMinutes(task.plannedMinutes);
                              setEditNotes(task.notes || "");
                            }}
                            title="Edit duration or notes"
                            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Notes, Mistakes & Error Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Day Log, Mistakes & Confidence</h3>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 mr-2 font-semibold">Confidence Rating:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setConfidence(star)}
                className="p-1 cursor-pointer transition-transform hover:scale-110"
              >
                <Star
                  className={`w-4 h-4 ${
                    star <= confidence ? "text-amber-400 fill-amber-400" : "text-slate-600"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={dayNotes}
          onChange={(e) => setDayNotes(e.target.value)}
          placeholder="Record mistake patterns, trade-offs, LeetCode runtime/memory complexity, or interview explanation thoughts..."
          rows={3}
          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {notesSavedSuccess ? "✓ Notes & Confidence saved!" : "Preserves historical study notes for reporting."}
          </span>
          <button
            type="button"
            onClick={handleSaveDayNotes}
            disabled={isSavingNotes}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSavingNotes ? "Saving..." : "Save Daily Log"}
          </button>
        </div>
      </div>

      {/* Partial Completion Modal */}
      {partialModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Mark Partially Completed</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter the actual minutes you spent studying "{partialModalTask.title}". The remaining minutes will be ready for carryover.
            </p>

            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Planned Duration:</span>
                <span className="font-semibold">{partialModalTask.plannedMinutes} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Actual Minutes Spent:</span>
                <span className="font-bold text-emerald-400">{partialMinutes} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Unfinished Remaining:</span>
                <span className="font-bold text-amber-400">
                  {Math.max(0, partialModalTask.plannedMinutes - partialMinutes)} min
                </span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Actual Study Minutes:
              </label>
              <input
                type="number"
                min={1}
                max={partialModalTask.plannedMinutes}
                value={partialMinutes}
                onChange={(e) => setPartialMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPartialModalTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePartial}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
              >
                Save Partial Minutes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Duration & Notes Modal */}
      {editTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold mb-1">Edit Task Duration & Notes</h3>
            <p className="text-xs text-slate-400 mb-4">{editTask.title}</p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Planned Minutes
                </label>
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Task Notes & Links
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTaskEdit}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                Update Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
