"use client";

import React, { useState, useEffect } from "react";
import { StudyDayDTO, CarryoverRecordDTO } from "@/lib/types";
import {
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Sliders,
} from "lucide-react";

interface CarryoverPlannerViewProps {
  currentDay: StudyDayDTO;
  onRefreshData: () => void;
  onSelectDay: (dayNumber: number) => void;
}

export function CarryoverPlannerView({
  currentDay,
  onRefreshData,
  onSelectDay,
}: CarryoverPlannerViewProps) {
  const [proposal, setProposal] = useState<{
    nextDay: {
      dayNumber: number;
      date: string;
      displayDate: string;
      originalPlannedMinutes: number;
    } | null;
    unfinishedTasks: Array<{
      id: string;
      title: string;
      category: string;
      plannedMinutes: number;
      actualMinutes: number;
      remainingMinutes: number;
      priority: number;
      status: string;
    }>;
    totalUnfinishedMinutes: number;
    workloadEvaluation: {
      totalMinutes: number;
      totalHours: number;
      isOverloaded: boolean;
      excessMinutes: number;
      warningMessage: string | null;
    };
  } | null>(null);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [targetDayNumber, setTargetDayNumber] = useState<number>(
    Math.min(180, currentDay.dayNumber + 1)
  );
  const [carryoverReason, setCarryoverReason] = useState<string>(
    "Carrying unfinished work to maintain 3-hour minimum focus"
  );
  const [historyRecords, setHistoryRecords] = useState<CarryoverRecordDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Workload resolution choice
  const [workloadOption, setWorkloadOption] = useState<string>("extend"); // "extend", "split", "prioritize"

  const fetchProposal = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/carryover?dayNumber=${currentDay.dayNumber}`);
      if (res.ok) {
        const data = await res.json();
        setProposal(data);
        // By default select all unfinished tasks
        setSelectedTaskIds(data.unfinishedTasks.map((t: { id: string }) => t.id));
      }

      // Fetch history
      const histRes = await fetch("/api/carryover?history=true");
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistoryRecords(histData);
      }
    } catch (err) {
      console.error("Failed to fetch carryover proposal:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposal();
  }, [currentDay.dayNumber]);

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (!proposal) return;
    if (selectedTaskIds.length === proposal.unfinishedTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(proposal.unfinishedTasks.map((t) => t.id));
    }
  };

  // Selected minutes
  const selectedMinutes =
    proposal?.unfinishedTasks
      .filter((t) => selectedTaskIds.includes(t.id))
      .reduce((sum, t) => sum + t.remainingMinutes, 0) || 0;

  const targetOriginalMinutes = proposal?.nextDay?.originalPlannedMinutes || 180;
  const proposedTotalWorkload = targetOriginalMinutes + selectedMinutes;
  const isOverloaded = proposedTotalWorkload > 180;
  const excessMinutes = Math.max(0, proposedTotalWorkload - 180);

  const handleExecuteCarryover = async () => {
    if (selectedTaskIds.length === 0) {
      setErrorMessage("Please select at least one unfinished task to carry forward.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/carryover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds: selectedTaskIds,
          sourceDayNumber: currentDay.dayNumber,
          targetDayNumber,
          reason: carryoverReason,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Carryover failed");
      }

      setSuccessMessage(
        `Successfully transferred ${selectedMinutes} minutes of unfinished work to Day ${targetDayNumber}!`
      );
      onRefreshData();
      fetchProposal();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Carryover failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndoCarryover = async (recordId: string) => {
    if (!confirm("Are you sure you want to undo this carryover? The transferred task will be removed from tomorrow's schedule and restored to its original day.")) {
      return;
    }

    try {
      const res = await fetch("/api/carryover/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carryoverRecordId: recordId }),
      });

      const resData = await res.json();
      if (!res.ok) {
        alert(resData.error || "Failed to undo carryover");
        return;
      }

      fetchProposal();
      onRefreshData();
    } catch (err) {
      console.error("Undo error:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Workload Management Engine
              </span>
              <span className="text-xs text-slate-400">
                Source: Day {currentDay.dayNumber} ({currentDay.displayDate})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Carryover Planner & Workload Balancer
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Transfer unfinished minutes to tomorrow without losing spent study time, historical adherence, or curriculum pacing.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl px-5 py-3 text-right">
            <span className="text-xs text-slate-400 font-semibold uppercase">Unfinished Work</span>
            <div className="text-2xl font-mono font-bold text-amber-400">
              {proposal?.totalUnfinishedMinutes || 0} min
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Carryover Planner Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Task Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Unfinished Tasks on Day {currentDay.dayNumber}</h3>
                <p className="text-xs text-slate-400">Select tasks to transfer remaining minutes</p>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                {proposal && selectedTaskIds.length === proposal.unfinishedTasks.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            {proposal?.unfinishedTasks && proposal.unfinishedTasks.length > 0 ? (
              <div className="space-y-3">
                {proposal.unfinishedTasks.map((task) => {
                  const isChecked = selectedTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleSelectTask(task.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-amber-950/20 border-amber-500/40 shadow-sm"
                          : "bg-slate-800/40 border-slate-700/80 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  task.priority === 1
                                    ? "bg-rose-500/20 text-rose-300"
                                    : "bg-indigo-500/20 text-indigo-300"
                                }`}
                              >
                                P{task.priority}
                              </span>
                              <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{task.category}</p>
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          <span className="font-mono font-bold text-amber-400">
                            {task.remainingMinutes} min to transfer
                          </span>
                          <div className="text-[10px] text-slate-400">
                            {task.actualMinutes}m already logged / {task.plannedMinutes}m orig
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">All planned tasks on Day {currentDay.dayNumber} are finished!</p>
                <p className="text-xs text-slate-500 mt-1">No pending minutes required to carry forward.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Smart Workload Balancer & Target Day */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Target Schedule Impact
            </h3>

            {/* Target Day Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Transfer Work To:
              </label>
              <select
                value={targetDayNumber}
                onChange={(e) => setTargetDayNumber(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 font-semibold cursor-pointer"
              >
                {Array.from({ length: 180 }, (_, i) => i + 1)
                  .filter((d) => d > currentDay.dayNumber)
                  .slice(0, 14)
                  .map((d) => (
                    <option key={d} value={d}>
                      Day {d} (Tomorrow / Later)
                    </option>
                  ))}
              </select>
            </div>

            {/* Workload Breakdown Card */}
            <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Original Plan:</span>
                <span className="font-semibold text-slate-200">{targetOriginalMinutes} min (3.0h)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Carried Work:</span>
                <span className="font-semibold text-amber-400">+{selectedMinutes} min</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold">
                <span className="text-white">Proposed Workload:</span>
                <span className={isOverloaded ? "text-amber-400 font-mono" : "text-emerald-400 font-mono"}>
                  {proposedTotalWorkload} min ({(proposedTotalWorkload / 60).toFixed(1)}h)
                </span>
              </div>
            </div>

            {/* Overload Warning Banner (>3 Hours) */}
            {isOverloaded && (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Workload Warning: Exceeds 3-Hour Target!</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  Target day workload is {proposedTotalWorkload} minutes (exceeds standard 180m by {excessMinutes}m). Choose your balancing strategy below:
                </p>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                    <input
                      type="radio"
                      name="workloadOption"
                      value="extend"
                      checked={workloadOption === "extend"}
                      onChange={() => setWorkloadOption("extend")}
                      className="text-amber-500"
                    />
                    <span>Complete all in a {(proposedTotalWorkload / 60).toFixed(1)}h extended session</span>
                  </label>
                  <label className="flex items-center gap-2 text-[11px] cursor-pointer">
                    <input
                      type="radio"
                      name="workloadOption"
                      value="prioritize"
                      checked={workloadOption === "prioritize"}
                      onChange={() => setWorkloadOption("prioritize")}
                      className="text-amber-500"
                    />
                    <span>Prioritize P1/P2 core work and defer optional stretch tasks</span>
                  </label>
                </div>
              </div>
            )}

            {/* Carryover Reason Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Audit Reason (Optional)
              </label>
              <input
                type="text"
                value={carryoverReason}
                onChange={(e) => setCarryoverReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            {/* Execute Button */}
            <button
              type="button"
              onClick={handleExecuteCarryover}
              disabled={isSubmitting || selectedTaskIds.length === 0}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Executing Carryover..." : `Confirm & Transfer ${selectedMinutes} min to Day ${targetDayNumber}`}
            </button>
          </div>
        </div>
      </div>

      {/* Carryover History Ledger with Undo Capability */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Carryover History Ledger</h3>
          </div>
          <span className="text-xs text-slate-400">
            {historyRecords.length} historical transfer events recorded
          </span>
        </div>

        {historyRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">From Date</th>
                  <th className="py-2.5 px-3">To Date</th>
                  <th className="py-2.5 px-3">Task Title</th>
                  <th className="py-2.5 px-3">Carried Min</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historyRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 text-slate-300 font-mono">{rec.fromDate}</td>
                    <td className="py-3 px-3 text-slate-300 font-mono">{rec.toDate}</td>
                    <td className="py-3 px-3 font-semibold text-white max-w-xs truncate">
                      {rec.sourceTask?.title || "Carried Task"}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {rec.carriedMinutes} min
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === "Active"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {rec.status === "Active" && (
                        <button
                          type="button"
                          onClick={() => handleUndoCarryover(rec.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Undo Carryover
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">No carryovers have been performed yet.</p>
        )}
      </div>
    </div>
  );
}
