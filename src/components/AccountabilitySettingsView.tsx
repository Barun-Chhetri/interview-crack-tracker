"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Users,
  ShieldCheck,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
} from "lucide-react";

export function AccountabilitySettingsView() {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // New recipient form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("Accountability Partner");

  // Email provider credentials form
  const [resendApiKey, setResendApiKey] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");

  // Auto delivery toggles
  const [autoDelivery, setAutoDelivery] = useState(false);
  const [autoFrequency, setAutoFrequency] = useState("daily");

  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/accountability");
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.recipients || []);
        setSettings(data.settings);
        setDeliveries(data.deliveries || []);
        setIsConfigured(data.isEmailConfigured);

        if (data.settings) {
          setAutoDelivery(data.settings.autoReportDelivery || false);
          setAutoFrequency(data.settings.autoReportFrequency || "daily");
          setSmtpHost(data.settings.smtpHost || "");
          setSmtpPort(data.settings.smtpPort || 587);
          setSmtpFrom(data.settings.smtpFrom || "");
        }
      }
    } catch (err) {
      console.error("Failed to load accountability settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      const res = await fetch("/api/accountability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addRecipient",
          name,
          email,
          relationship,
          receiveDaily: true,
          receiveWeekly: true,
          receiveMonthly: true,
        }),
      });

      if (res.ok) {
        setName("");
        setEmail("");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to add recipient:", err);
    }
  };

  const handleDeleteRecipient = async (id: string) => {
    if (!confirm("Are you sure you want to remove this recipient?")) return;
    try {
      await fetch("/api/accountability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteRecipient", recipientId: id }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to delete recipient:", err);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/accountability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateSettings",
          autoReportDelivery: autoDelivery,
          autoReportFrequency: autoFrequency,
          smtpHost: smtpHost || undefined,
          smtpPort: smtpPort || undefined,
          smtpUser: smtpUser || undefined,
          smtpPass: smtpPass || undefined,
          smtpFrom: smtpFrom || undefined,
          resendApiKey: resendApiKey || undefined,
        }),
      });
      alert("Settings updated successfully!");
      fetchData();
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/reports/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipients[0]?.email || undefined,
          reportType: "Daily",
          dayNumber: 1,
          customNote: "Test notification from 180-Day Tracker setup.",
        }),
      });

      const resData = await res.json();
      setTestResult({
        status: resData.status,
        message: resData.message || (resData.success ? "Test report delivered successfully!" : "Delivery test failed"),
      });
      fetchData();
    } catch (err: unknown) {
      setTestResult({
        status: "Failed",
        message: err instanceof Error ? err.message : "Delivery test failed",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Accountability Network
              </span>
              <span className="text-xs text-slate-400">Section 10: Real Delivery Mechanism</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Accountability Partner & Email Configuration
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Deliver daily and weekly study reports to a trusted mentor, friend, or partner. Requires explicit consent before enabling automated delivery.
            </p>
          </div>

          <div
            className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              isConfigured
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/20 border-amber-500/30 text-amber-300"
            }`}
          >
            {isConfigured ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{isConfigured ? "Email Provider Configured" : "Email Provider Pending Setup"}</span>
          </div>
        </div>
      </div>

      {/* Recipient Management & Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Partner Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Accountability Partners</h3>
          </div>

          {/* Add Recipient Form */}
          <form onSubmit={handleAddRecipient} className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase text-slate-400">Add New Recipient</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Partner Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="email"
                placeholder="partner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Relationship (e.g. Mentor, Peer)"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white flex-1"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                Add Partner
              </button>
            </div>
          </form>

          {/* Existing Partners List */}
          <div className="space-y-2.5">
            {recipients.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60"
              >
                <div>
                  <h5 className="text-sm font-bold text-white">{r.name}</h5>
                  <p className="text-xs text-slate-400 font-mono">{r.email}</p>
                  <span className="text-[10px] text-indigo-400 font-semibold">{r.relationship}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteRecipient(r.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Email Provider & Consent Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <Server className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Delivery Provider Setup</h3>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white block">Automated Scheduled Reports</label>
                <p className="text-[11px] text-slate-400">Explicit user consent required</p>
              </div>
              <input
                type="checkbox"
                checked={autoDelivery}
                onChange={(e) => setAutoDelivery(e.target.checked)}
                className="w-4 h-4 text-emerald-500 rounded cursor-pointer"
              />
            </div>

            {autoDelivery && (
              <div className="pt-2 border-t border-slate-800/60 flex items-center gap-3">
                <span className="text-xs text-slate-300">Frequency:</span>
                <select
                  value={autoFrequency}
                  onChange={(e) => setAutoFrequency(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <option value="daily">Daily at End of Study</option>
                  <option value="weekly">Weekly Summary on Sunday</option>
                </select>
              </div>
            )}
          </div>

          {/* Credentials Inputs (Resend or SMTP) */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Resend API Key (Recommended for zero-setup delivery)
              </label>
              <input
                type="password"
                placeholder="re_xxxxxxxxxxxxxx"
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">OR Use Standard SMTP:</span>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="SMTP Host (e.g. smtp.mailgun.org)"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Port (587 or 465)"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="SMTP Username"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="password"
                  placeholder="SMTP Password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? "Testing Delivery..." : "Test Delivery Now"}
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Delivery Settings"}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.status === "Sent"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {testResult.status === "Sent" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delivery History Audit Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Report Delivery Audit Log</h3>
          </div>
          <span className="text-xs text-slate-400">{deliveries.length} delivery attempts logged</span>
        </div>

        {deliveries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Report Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Details / Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {deliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 text-slate-300 font-mono">
                      {new Date(del.createdAt).toLocaleDateString()} {new Date(del.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white font-mono">{del.recipientEmail}</td>
                    <td className="py-3 px-3">{del.reportType} Report</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          del.status === "Sent"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {del.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                      {del.errorMessage || "Delivered successfully"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4">No report deliveries have been attempted yet.</p>
        )}
      </div>
    </div>
  );
}
