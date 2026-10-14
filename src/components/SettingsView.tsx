"use client";

import React, { useState } from "react";
import {
  Settings,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  Shield,
  FileCode,
} from "lucide-react";

export function SettingsView() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `interview_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export database");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            System & Data Integrity
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Settings & Full Data Export
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Manage your student profile, study parameters, and download persistent local backups of all recorded progress, timers, and carryovers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Student Profile</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Student Name:</span>
              <span className="font-semibold text-white">Barun Chhetri</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Institution:</span>
              <span className="font-semibold text-white">University of North Texas (UNT)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Class Standing:</span>
              <span className="font-semibold text-white">Junior (Computer Science)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Visa Status:</span>
              <span className="font-semibold text-emerald-400">F-1 Student Visa</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Target Opportunity:</span>
              <span className="font-semibold text-indigo-300">Summer 2027 Software Engineering Internship</span>
            </div>
          </div>
        </div>

        {/* Program Commitment Parameters */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Program Commitments</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Program Dates:</span>
              <span className="font-mono text-white">Oct 14, 2026 &ndash; Apr 11, 2027</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Duration:</span>
              <span className="font-semibold text-white">180 Consecutive Days</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Daily Minimum Target:</span>
              <span className="font-bold text-emerald-400">3.0 Hours (180 Minutes)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/60">
              <span className="text-slate-400">Weekly Target:</span>
              <span className="font-bold text-emerald-400">21.0 Hours / Week</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Total Planned Study Time:</span>
              <span className="font-bold text-white">540.0 Focused Hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export & Backup Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Complete Data Backup & Export</h3>
              <p className="text-xs text-slate-400">Export your entire 180-day progress, timers, notes, and carryover ledger as JSON</p>
            </div>
          </div>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Download JSON Backup"}
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Your data is persisted in a local relational database (`dev.db`). This export provides an independent snapshot you can keep on Google Drive, GitHub, or use to restore on another computer.
        </p>
      </div>
    </div>
  );
}
