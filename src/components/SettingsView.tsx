"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Download,
  Clock,
  User,
  Shield,
  Database,
  Edit2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Save,
  Server,
  RefreshCw,
  RotateCcw,
  Mail,
  Send,
  Key,
  ExternalLink,
  Check,
} from "lucide-react";

export function SettingsView() {
  const { user, updateProfile, setShowAuthModal, setAuthModalMode } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [visaStatus, setVisaStatus] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [saveProfileError, setSaveProfileError] = useState<string | null>(null);
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Database health state
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Email Delivery Configuration state
  const [isEmailConfigured, setIsEmailConfigured] = useState(false);
  const [providerPreset, setProviderPreset] = useState<"resend" | "gmail" | "outlook" | "custom">("resend");
  const [resendApiKey, setResendApiKey] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [defaultRecipientEmail, setDefaultRecipientEmail] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{
    type: "success" | "error" | "warning";
    message: string;
    previewUrl?: string;
  } | null>(null);

  const fetchEmailSettings = async () => {
    try {
      const res = await fetch("/api/accountability");
      if (res.ok) {
        const data = await res.json();
        setIsEmailConfigured(data.isEmailConfigured || false);
        if (data.settings) {
          if (data.settings.smtpHost) setSmtpHost(data.settings.smtpHost);
          if (data.settings.smtpPort) setSmtpPort(data.settings.smtpPort);
          if (data.settings.smtpFrom) setSmtpFrom(data.settings.smtpFrom);
          if (data.settings.defaultRecipientEmail) setDefaultRecipientEmail(data.settings.defaultRecipientEmail);
          if (data.settings.hasResendKey) setResendApiKey("••••••••••••••••");
          if (data.settings.hasSmtpPass) setSmtpPass("••••••••••••••••");
        }
        if (data.defaultRecipientEmail) {
          setDefaultRecipientEmail(data.defaultRecipientEmail);
        }
        if (data.provider === "resend") {
          setProviderPreset("resend");
        } else if (data.settings?.smtpHost?.includes("gmail")) {
          setProviderPreset("gmail");
        } else if (data.settings?.smtpHost?.includes("office365")) {
          setProviderPreset("outlook");
        } else if (data.provider === "smtp") {
          setProviderPreset("custom");
        }
      }
    } catch (err) {
      console.error("Failed to load email settings:", err);
    }
  };

  const handleSaveEmailSettings = async () => {
    setIsSavingEmail(true);
    setEmailFeedback(null);
    try {
      let finalHost = smtpHost;
      let finalPort = smtpPort;
      let finalFrom = smtpFrom;

      if (providerPreset === "gmail") {
        finalHost = "smtp.gmail.com";
        finalPort = 587;
        if (!finalFrom && smtpUser) finalFrom = `"Interview Prep Tracker" <${smtpUser}>`;
      } else if (providerPreset === "outlook") {
        finalHost = "smtp.office365.com";
        finalPort = 587;
        if (!finalFrom && smtpUser) finalFrom = `"Interview Prep Tracker" <${smtpUser}>`;
      }

      const res = await fetch("/api/accountability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateSettings",
          resendApiKey: providerPreset === "resend" && !resendApiKey.includes("••••") ? resendApiKey : undefined,
          smtpHost: providerPreset !== "resend" ? finalHost : undefined,
          smtpPort: providerPreset !== "resend" ? finalPort : undefined,
          smtpUser: providerPreset !== "resend" ? smtpUser : undefined,
          smtpPass: providerPreset !== "resend" && !smtpPass.includes("••••") ? smtpPass : undefined,
          smtpFrom: finalFrom || undefined,
          defaultRecipientEmail: defaultRecipientEmail || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setEmailFeedback({
          type: "success",
          message: "Email provider settings saved successfully! You can now send reports via email.",
        });
        fetchEmailSettings();
      } else {
        setEmailFeedback({
          type: "error",
          message: data.error || "Failed to save email settings.",
        });
      }
    } catch (err) {
      setEmailFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error saving email settings.",
      });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleTestEmailSettings = async () => {
    setIsTestingEmail(true);
    setEmailFeedback(null);
    try {
      const res = await fetch("/api/accountability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "testEmail",
          recipientEmail: defaultRecipientEmail || user?.email || "test@example.com",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailFeedback({
          type: "success",
          message: data.message || "Test email sent successfully!",
          previewUrl: data.previewUrl,
        });
      } else {
        setEmailFeedback({
          type: data.status === "Not Configured" ? "warning" : "error",
          message: data.message || "Email delivery failed.",
        });
      }
    } catch (err) {
      setEmailFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Test request failed.",
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setUniversity(user.university);
      setVisaStatus(user.visaStatus);
      setTargetRole(user.targetRole);
    }
  }, [user]);

  const checkDbHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setDbHealth(data);
    } catch (err) {
      setDbHealth({
        status: "error",
        database: { connected: false, error: "Health check request failed" },
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkDbHealth();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setSaveProfileError(null);
    setSaveProfileSuccess(false);

    const res = await updateProfile({
      name,
      university,
      visaStatus,
      targetRole,
    });

    setIsSavingProfile(false);
    if (res.success) {
      setSaveProfileSuccess(true);
      setIsEditingProfile(false);
      setTimeout(() => setSaveProfileSuccess(false), 3000);
    } else {
      setSaveProfileError(res.error || "Failed to update profile");
    }
  };

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

  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetProgress = async () => {
    if (!confirm("Are you sure you want to reset all 180 study days and tasks to 0 minutes? This will clear all recorded study sessions and carryovers.")) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch("/api/curriculum/reset", { method: "POST" });
      if (res.ok) {
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3000);
        window.location.reload();
      } else {
        alert("Failed to reset study progress");
      }
    } catch (err) {
      console.error("Reset failed:", err);
      alert("Failed to reset study progress");
    } finally {
      setIsResetting(false);
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
          Settings, Profile & Database Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Manage your student profile, verify real PostgreSQL database connectivity, and download persistent local backups of all recorded progress, timers, and carryovers.
        </p>
      </div>

      {/* Database Connection & Health Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Database Backend Connection</h3>
              <p className="text-xs text-slate-400">Verifies live connectivity to your active database</p>
            </div>
          </div>
          <button
            onClick={checkDbHealth}
            disabled={isCheckingHealth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? "animate-spin" : ""}`} />
            <span>Check Connectivity</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Database Driver:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {dbHealth?.database?.type || "SQLite"} (Prisma ORM)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Location / Target:</span>
              <span className="font-mono text-white">
                {dbHealth?.database?.location || "prisma/dev.db (Local)"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Target Database:</span>
              <span className="font-mono text-white">
                {dbHealth?.database?.type === "PostgreSQL" ? "barun_db (user: barun)" : "dev.db (Relational)"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Connection Status:</span>
              {dbHealth?.database?.connected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected ({dbHealth.database.responseTimeMs}ms)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {dbHealth ? "Database Disconnected" : "Checking..."}
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-slate-300">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              <span>Persistence & Data Integrity</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All 180 study days, curriculum schedules, timers, carryovers, STAR stories, and user accounts persist reliably through Prisma ORM.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              To switch between SQLite and PostgreSQL, update <code className="text-indigo-300">DATABASE_URL</code> in <code className="text-indigo-300">.env</code> and run <code className="text-slate-200">npx prisma db push</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Email Delivery & Accountability Report Distribution Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Email Delivery & Report Distribution</h3>
              <p className="text-xs text-slate-400">
                Configure Resend or SMTP (Gmail/Outlook) to send study analysis reports directly to mentors, partners, or peers
              </p>
            </div>
          </div>

          <div
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              isEmailConfigured
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/20 border-amber-500/30 text-amber-300"
            }`}
          >
            {isEmailConfigured ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{isEmailConfigured ? "Email Delivery Configured" : "Email Delivery Not Configured"}</span>
          </div>
        </div>

        {/* Email Provider Selection Tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-2">Choose Provider:</span>
            {[
              { id: "resend", label: "Resend (Recommended)", tag: "Zero Setup" },
              { id: "gmail", label: "Gmail SMTP", tag: "App Password" },
              { id: "outlook", label: "Outlook / Office 365", tag: "Standard" },
              { id: "custom", label: "Custom SMTP", tag: "Any Server" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProviderPreset(p.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  providerPreset === p.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>{p.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-900/60 text-slate-300">
                  {p.tag}
                </span>
              </button>
            ))}
          </div>

          {/* Resend Provider Configuration */}
          {providerPreset === "resend" && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-300 font-semibold">Resend API Key Setup</span>
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-semibold"
                >
                  <span>Get Free Resend API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resend API Key <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Tip: Resend provides 100 free emails/day. Study reports will be sent from <code className="text-indigo-300">Interview Prep Tracker &lt;onboarding@resend.dev&gt;</code> without requiring custom domain DNS verification.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom "From" Email (Optional &mdash; requires verified domain in Resend)
                </label>
                <input
                  type="text"
                  placeholder="Interview Prep Tracker <noreply@yourdomain.com>"
                  value={smtpFrom}
                  onChange={(e) => setSmtpFrom(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Gmail Provider Configuration */}
          {providerPreset === "gmail" && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 leading-relaxed space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Important for Gmail Users:</span>
                </span>
                <p>
                  Google requires a <strong>16-character App Password</strong> (your regular Google account password will be rejected).
                  To generate one: Go to <strong>Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords</strong>, name it "Interview Tracker", and paste the generated 16-letter code below.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gmail Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="your-name@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    16-Character Google App Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="abcd efgh ijkl mnop"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                <div>
                  <span className="block font-semibold mb-1">SMTP Host:</span>
                  <input
                    type="text"
                    disabled
                    value="smtp.gmail.com"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400"
                  />
                </div>
                <div>
                  <span className="block font-semibold mb-1">Port:</span>
                  <input
                    type="text"
                    disabled
                    value="587 (TLS)"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Outlook Provider Configuration */}
          {providerPreset === "outlook" && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Outlook / Microsoft 365 Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="student@outlook.com or university.edu"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password / App Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Your password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                <div>
                  <span className="block font-semibold mb-1">SMTP Host:</span>
                  <input
                    type="text"
                    disabled
                    value="smtp.office365.com"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400"
                  />
                </div>
                <div>
                  <span className="block font-semibold mb-1">Port:</span>
                  <input
                    type="text"
                    disabled
                    value="587"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Custom SMTP Configuration */}
          {providerPreset === "custom" && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SMTP Host <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. smtp.mailgun.org, smtp.sendgrid.net"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Port <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="587 or 465"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SMTP Username / API User <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="username or postmaster@domain.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SMTP Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="password or SMTP API key"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  From Address
                </label>
                <input
                  type="text"
                  placeholder='"Interview Tracker" <reports@yourdomain.com>'
                  value={smtpFrom}
                  onChange={(e) => setSmtpFrom(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Default Recipient Email Field */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Default Recipient Email (Accountability Partner / Mentor / Self)
            </label>
            <input
              type="email"
              placeholder="e.g. mentor@company.com or accountability@partner.dev"
              value={defaultRecipientEmail}
              onChange={(e) => setDefaultRecipientEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Reports will be addressed to this recipient by default, though you can also specify any email when sending directly from the Reports view.
            </p>
          </div>

          {/* Action Buttons & Feedback */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestEmailSettings}
              disabled={isTestingEmail}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTestingEmail ? "Testing Connection..." : "Send Verification Email"}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveEmailSettings}
              disabled={isSavingEmail}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
            >
              {isSavingEmail ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSavingEmail ? "Saving Settings..." : "Save Email Credentials"}</span>
            </button>
          </div>

          {emailFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 ${
                emailFeedback.type === "success"
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                  : emailFeedback.type === "warning"
                  ? "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                  : "bg-rose-500/20 border border-rose-500/30 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {emailFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{emailFeedback.message}</span>
              </div>
              {emailFeedback.previewUrl && (
                <a
                  href={emailFeedback.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] inline-flex items-center gap-1 shrink-0"
                >
                  <span>View Sent Email</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Student Profile</h3>
            </div>
            {user ? (
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingProfile ? "Cancel" : "Edit Profile"}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode("login");
                  setShowAuthModal(true);
                }}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

          {saveProfileSuccess && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {saveProfileError && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{saveProfileError}</span>
            </div>
          )}

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Institution</label>
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Visa Status</label>
                <select
                  value={visaStatus}
                  onChange={(e) => setVisaStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="F-1">F-1 Student Visa</option>
                  <option value="J-1">J-1 Exchange Visa</option>
                  <option value="US Citizen / PR">US Citizen / PR</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Target Opportunity</label>
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Student Name:</span>
                <span className="font-semibold text-white">{user?.name || "Candidate"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Account Email:</span>
                <span className="font-mono text-slate-300">{user?.email || "Not signed in"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Institution:</span>
                <span className="font-semibold text-white">{user?.university || "University of North Texas (UNT)"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Visa Status:</span>
                <span className="font-semibold text-emerald-400">{user?.visaStatus || "F-1 Student Visa"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Target Opportunity:</span>
                <span className="font-semibold text-indigo-300">{user?.targetRole || "Summer 2027 Software Engineering Internship"}</span>
              </div>
            </div>
          )}
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
          Your data is structured for local relational database persistence. This export provides an independent snapshot you can keep on Google Drive, GitHub, or use to restore on another computer.
        </p>
      </div>

      {/* Reset Study Progress Card */}
      <div className="bg-slate-900 border border-rose-900/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-base font-bold text-white">Reset Study Progress</h3>
              <p className="text-xs text-slate-400">Restart your 180-day curriculum fresh from Day 1 (0 studied minutes, all tasks uncompleted)</p>
            </div>
          </div>
          <button
            onClick={handleResetProgress}
            disabled={isResetting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isResetting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span>{isResetting ? "Resetting..." : "Reset to Day 1 (0 min)"}</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Curriculum progress successfully reset to 0 minutes!</span>
          </div>
        )}

        <p className="text-xs text-slate-400 leading-relaxed">
          This resets all 180 curriculum days and scheduled tasks back to their original zero-progress state, and removes any previous study session logs and carryover transfers.
        </p>
      </div>
    </div>
  );
}
