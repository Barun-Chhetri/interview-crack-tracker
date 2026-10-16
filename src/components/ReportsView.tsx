"use client";

import React, { useState, useEffect } from "react";
import {
  FileBarChart2,
  Calendar,
  Send,
  Download,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Copy,
  Clock,
  Sparkles,
  ExternalLink,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ReportsViewProps {
  currentDayNumber: number;
  onNavigateTab?: (tab: string) => void;
}

export function ReportsView({ currentDayNumber, onNavigateTab }: ReportsViewProps) {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");

  // Selection states
  const [selectedDay, setSelectedDay] = useState<number>(currentDayNumber);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);

  // Data states
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Email delivery & modal states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isEmailConfigured, setIsEmailConfigured] = useState<boolean | null>(null);
  const [configuredProvider, setConfiguredProvider] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{
    status: string;
    message: string;
    previewUrl?: string;
  } | null>(null);

  // Inline Quick Config state
  const [showQuickConfig, setShowQuickConfig] = useState(false);
  const [quickProvider, setQuickProvider] = useState<"resend" | "gmail">("resend");
  const [quickResendKey, setQuickResendKey] = useState("");
  const [quickSmtpUser, setQuickSmtpUser] = useState("");
  const [quickSmtpPass, setQuickSmtpPass] = useState("");
  const [copiedTextSuccess, setCopiedTextSuccess] = useState(false);

  const fetchEmailConfig = async () => {
    try {
      const res = await fetch("/api/accountability");
      if (res.ok) {
        const data = await res.json();
        setIsEmailConfigured(data.isEmailConfigured);
        setConfiguredProvider(data.provider);
        if (data.defaultRecipientEmail && !recipientEmail) {
          setRecipientEmail(data.defaultRecipientEmail);
        }
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchEmailConfig();
  }, []);

  const fetchReport = async () => {
    setIsLoading(true);
    setSendStatus(null);
    try {
      let url = "";
      if (reportType === "daily") {
        url = `/api/reports/daily?dayNumber=${selectedDay}`;
      } else if (reportType === "weekly") {
        url = `/api/reports/weekly?week=${selectedWeek}`;
      } else {
        url = `/api/reports/monthly?month=${selectedMonth}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDay, selectedWeek, selectedMonth]);

  const handleSendEmail = async () => {
    setIsSending(true);
    setSendStatus(null);

    try {
      const res = await fetch("/api/reports/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail || undefined,
          reportType: reportType.charAt(0).toUpperCase() + reportType.slice(1),
          dayNumber: selectedDay,
          weekNumber: selectedWeek,
          monthNumber: selectedMonth,
          customNote,
        }),
      });

      const resData = await res.json();
      setSendStatus({
        status: resData.status,
        message: resData.message || (resData.success ? "Report sent successfully!" : "Failed to deliver report"),
        previewUrl: resData.previewUrl,
      });

      if (resData.status === "Not Configured") {
        setIsEmailConfigured(false);
        setShowQuickConfig(true);
      } else if (resData.success) {
        setIsEmailConfigured(true);
      }
    } catch (err: unknown) {
      setSendStatus({
        status: "Failed",
        message: err instanceof Error ? err.message : "Delivery failed",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickSaveAndSend = async () => {
    setIsSending(true);
    setSendStatus(null);
    try {
      const saveRes = await fetch("/api/accountability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateSettings",
          resendApiKey: quickProvider === "resend" ? quickResendKey : undefined,
          smtpHost: quickProvider === "gmail" ? "smtp.gmail.com" : undefined,
          smtpPort: quickProvider === "gmail" ? 587 : undefined,
          smtpUser: quickProvider === "gmail" ? quickSmtpUser : undefined,
          smtpPass: quickProvider === "gmail" ? quickSmtpPass : undefined,
          defaultRecipientEmail: recipientEmail || undefined,
        }),
      });

      if (!saveRes.ok) {
        const saveErr = await saveRes.json();
        throw new Error(saveErr.error || "Failed to save email settings");
      }

      setIsEmailConfigured(true);
      setShowQuickConfig(false);
      await fetchEmailConfig();

      // Immediately send report
      await handleSendEmail();
    } catch (err: unknown) {
      setSendStatus({
        status: "Failed",
        message: err instanceof Error ? err.message : "Failed to configure and send report",
      });
      setIsSending(false);
    }
  };

  const handleSendTestPreview = async () => {
    setIsSending(true);
    setSendStatus(null);
    try {
      const res = await fetch("/api/reports/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail || "preview@example.com",
          reportType: reportType.charAt(0).toUpperCase() + reportType.slice(1),
          dayNumber: selectedDay,
          weekNumber: selectedWeek,
          monthNumber: selectedMonth,
          customNote,
          testMode: true,
        }),
      });

      const resData = await res.json();
      setSendStatus({
        status: resData.status,
        message: resData.message || "Test preview report generated!",
        previewUrl: resData.previewUrl,
      });
    } catch (err: unknown) {
      setSendStatus({
        status: "Failed",
        message: err instanceof Error ? err.message : "Preview generation failed",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!reportData) return;
    const typeLabel = reportType.charAt(0).toUpperCase() + reportType.slice(1);
    let summaryText = `[180-Day Tracker] ${typeLabel} Study Report\n`;
    if (reportType === "daily") {
      summaryText += `Date: ${reportData.displayDate} (Day ${reportData.dayNumber}/180)\n`;
      summaryText += `Topic: ${reportData.topic || ""}\n`;
      summaryText += `Actual Time: ${reportData.actualMinutes}m (${(reportData.actualMinutes / 60).toFixed(1)}h)\n`;
      summaryText += `Target Met: ${reportData.actualMinutes >= 180 ? "Yes" : "No"}\n`;
    } else if (reportType === "weekly") {
      summaryText += `Week ${reportData.weekNumber || selectedWeek} Summary\n`;
      summaryText += `Actual Hours: ${reportData.actualHours}h\n`;
      summaryText += `Adherence: ${reportData.adherencePercent}%\n`;
    } else {
      summaryText += `Month ${reportData.monthNumber || selectedMonth} Milestone\n`;
      summaryText += `Progress: ${reportData.curriculumProgress}%\n`;
      summaryText += `Consistency: ${reportData.consistencyRate}%\n`;
    }
    if (customNote) {
      summaryText += `Note: ${customNote}\n`;
    }
    navigator.clipboard.writeText(summaryText);
    setCopiedTextSuccess(true);
    setTimeout(() => setCopiedTextSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Accountability & Progress Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Study Activity & Progress Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Generated directly from your actual recorded study sessions and task completions. Preview, export, or send to your mentor or partner.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Send to Accountability Partner
          </button>
        </div>
      </div>

      {/* Report Type Selector & Parameter Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          {(["daily", "weekly", "monthly"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                reportType === type
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {type} Report
            </button>
          ))}
        </div>

        {/* Dynamic Selector based on report type */}
        <div className="flex items-center gap-3">
          {reportType === "daily" && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span>Program Day:</span>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
              >
                {Array.from({ length: 180 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d} / 180
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === "weekly" && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span>Week:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
              >
                {Array.from({ length: 26 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Week {w} of 26
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === "monthly" && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span>Curriculum Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6].map((m) => (
                  <option key={m} value={m}>
                    Month {m} of 6
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Report Content Body */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Loading report data...</div>
      ) : reportData ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Daily Report View */}
          {reportType === "daily" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Daily Accountability Report &bull; Day {reportData.dayNumber}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{reportData.displayDate}</p>
                </div>
                <div
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                    reportData.metDailyTarget
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {reportData.metDailyTarget ? "✓ 3h Target Achieved" : "Target Not Met"}
                </div>
              </div>

              {/* Hours Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Planned Hours</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">{reportData.plannedHours} hrs</div>
                </div>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-emerald-400">Actual Hours</span>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{reportData.actualHours} hrs</div>
                </div>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Tasks Completed</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {reportData.completedTasksCount} / {reportData.totalTasksCount}
                  </div>
                </div>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-amber-400">Carried Forward</span>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {reportData.carriedTasksCount} tasks
                  </div>
                </div>
              </div>

              {/* Topics & Deliverables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs font-bold uppercase text-indigo-400">Topics & Concepts Reviewed</span>
                  <p className="text-xs text-slate-200">{reportData.topicsReviewed || "Core DSA topic"}</p>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs font-bold uppercase text-emerald-400">Tomorrow's Priorities</span>
                  <p className="text-xs text-slate-200">{reportData.tomorrowPriorities}</p>
                </div>
              </div>

              {/* Reflection & Mistakes */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs font-bold uppercase text-amber-400">Mistakes & Error Log</span>
                <p className="text-xs text-slate-300 italic">{reportData.mistakesDiscovered}</p>
              </div>
            </div>
          )}

          {/* Weekly Report View */}
          {reportType === "weekly" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Week {reportData.weekNumber} Comprehensive Progress Report
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {reportData.startDate} &ndash; {reportData.endDate}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {reportData.actualHours}h / {reportData.plannedHours}h
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {reportData.adherencePercent}% Task Schedule Adherence
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Problems Attempted</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {reportData.totalProblemsAttempted}
                  </div>
                </div>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-emerald-400">Independent Solves</span>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {reportData.independentSolves}
                  </div>
                </div>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-indigo-400">Spaced Rep Success</span>
                  <div className="text-xl font-bold font-mono text-indigo-300 mt-1">
                    {reportData.spacedRepSuccessRate}%
                  </div>
                </div>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-amber-400">Carried Work</span>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {reportData.carryoverRemainingMinutes}m
                  </div>
                </div>
              </div>

              <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/20 space-y-2">
                <h4 className="text-xs font-bold uppercase text-indigo-300">Coach Recommendations for Next Week</h4>
                <p className="text-xs text-slate-200 leading-relaxed">{reportData.recommendations}</p>
              </div>
            </div>
          )}

          {/* Monthly Report View */}
          {reportType === "monthly" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Month {reportData.monthNumber} Curriculum Milestone Report
                  </h3>
                  <p className="text-xs text-indigo-400 font-semibold mt-0.5">{reportData.phaseName}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    Days {reportData.startDay} &ndash; {reportData.endDay} ({reportData.startDate} to {reportData.endDate})
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono text-purple-400">
                    {reportData.curriculumProgress}% Progress
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Consistency Rate: {reportData.consistencyRate}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Days Meeting Target</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {reportData.daysMeetingTarget} / 30 days
                  </div>
                </div>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-emerald-400">Milestone Assessment</span>
                  <div className="text-base font-bold text-emerald-400 mt-1">
                    {reportData.assessmentResult}
                  </div>
                </div>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-indigo-400">Readiness Trend</span>
                  <div className="text-base font-bold text-indigo-300 mt-1">
                    {reportData.readinessTrends}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-300">Top Priorities for Next Month</h4>
                <ul className="text-xs text-slate-200 list-disc list-inside space-y-1">
                  {reportData.topPrioritiesNextMonth?.map((p: string, idx: number) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Send Report Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl p-6 text-white shadow-2xl space-y-4 my-8">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Send Study Analysis Report</h3>
                  <p className="text-xs text-slate-400">
                    Dispatch verified {reportType} study progress to mentor, partner, or yourself
                  </p>
                </div>
              </div>

              <div
                className={`px-3 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 shrink-0 ${
                  isEmailConfigured
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                    : "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                }`}
              >
                {isEmailConfigured ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>
                  {isEmailConfigured
                    ? `Live Delivery (${configuredProvider || "Configured"})`
                    : "Ready (Test Preview Mode)"}
                </span>
              </div>
            </div>

            {/* Report Context Badge */}
            <div className="flex items-center justify-between bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Attached Report:</span>
              <span className="font-bold text-indigo-300 font-mono">
                {reportType === "daily"
                  ? `Day ${selectedDay} Daily Report (${reportData?.displayDate || "Selected Day"})`
                  : reportType === "weekly"
                  ? `Week ${selectedWeek} Weekly Summary`
                  : `Month ${selectedMonth} Executive Report`}
              </span>
            </div>

            {/* Status Message Banner */}
            {sendStatus && (
              <div
                className={`p-3.5 rounded-xl text-xs space-y-2 ${
                  sendStatus.status === "Sent"
                    ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                    : sendStatus.status === "Not Configured"
                    ? "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                    : "bg-rose-500/20 border border-rose-500/30 text-rose-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {sendStatus.status === "Sent" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span className="leading-relaxed">{sendStatus.message}</span>
                  </div>
                  {sendStatus.previewUrl && (
                    <a
                      href={sendStatus.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Preview Email</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* When Not Configured with Live Credentials: Offer Fast Setup and Explanation */}
            {!isEmailConfigured && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-indigo-200 leading-relaxed">
                    <strong>Test Delivery Mode Active.</strong> Reports will be dispatched and viewable via an instant web preview link. To send directly into external recipient inboxes (Gmail/Outlook), configure your Resend or SMTP credentials below or in Settings.
                  </div>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailModal(false);
                        onNavigateTab("settings");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-[11px] inline-flex items-center gap-1 shrink-0 border border-slate-700 cursor-pointer"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Settings</span>
                    </button>
                  )}
                </div>

                {/* Quick Setup Collapsible Drawer */}
                <div className="pt-2 border-t border-amber-500/20">
                  <button
                    type="button"
                    onClick={() => setShowQuickConfig(!showQuickConfig)}
                    className="flex items-center justify-between w-full text-indigo-300 hover:text-indigo-200 font-bold text-xs cursor-pointer"
                  >
                    <span>⚡ Quick Setup Credentials in 30 Seconds</span>
                    {showQuickConfig ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showQuickConfig && (
                    <div className="mt-3 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setQuickProvider("resend")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            quickProvider === "resend"
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-900 text-slate-400"
                          }`}
                        >
                          Resend API Key
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickProvider("gmail")}
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            quickProvider === "gmail"
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-900 text-slate-400"
                          }`}
                        >
                          Gmail App Password
                        </button>
                      </div>

                      {quickProvider === "resend" ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Resend API Key (re_...)
                          </label>
                          <input
                            type="password"
                            placeholder="re_xxxxxxxxxxxxxx"
                            value={quickResendKey}
                            onChange={(e) => setQuickResendKey(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="email"
                            placeholder="your-name@gmail.com"
                            value={quickSmtpUser}
                            onChange={(e) => setQuickSmtpUser(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="password"
                            placeholder="16-character Google App Password"
                            value={quickSmtpPass}
                            onChange={(e) => setQuickSmtpPass(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleQuickSaveAndSend}
                        disabled={isSending}
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                      >
                        {isSending ? "Saving & Delivering..." : "Save Credentials & Send Report"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recipient and Custom Notes Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recipient Email(s) <span className="text-slate-500 font-normal">(comma-separated for multiple)</span>
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="mentor@example.com, friend@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Personal Note / Reflection <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Hey, finished my 3-hour minimum today! Crushed the HashSet sequence pattern."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedTextSuccess ? "Copied!" : "Copy Report Text"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendTestPreview}
                  disabled={isSending}
                  title="Generate a real HTML email delivered to an instant Ethereal web preview"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-indigo-300 transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Send Test Preview</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSending
                      ? "Delivering..."
                      : isEmailConfigured
                      ? "Send Live Report"
                      : "Send Report"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
