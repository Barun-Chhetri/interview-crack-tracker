"use client";

import React, { useState, useEffect } from "react";
import {
  Code2,
  Users,
  Briefcase,
  CheckCircle2,
  Circle,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Save,
  Star,
  Loader2,
  Link as LinkIcon,
  Building,
  Calendar,
} from "lucide-react";

interface ProjectStageItem {
  id: string;
  stageNumber: number;
  title: string;
  focus: string;
  proofRequirements: string;
  isCompleted: boolean;
  notes?: string | null;
  repoUrl?: string | null;
}

interface StarStoryItem {
  id: string;
  category: string;
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  confidence: number;
  isCustom: boolean;
}

interface RecruitingChecklist {
  id: string;
  category: string;
  title: string;
  detail?: string | null;
  isCompleted: boolean;
}

interface JobApp {
  id: string;
  company: string;
  position: string;
  location?: string | null;
  status: string;
  dateApplied: string;
  jobUrl?: string | null;
  notes?: string | null;
}

export function ProjectRecruitingView() {
  const [activeSubTab, setActiveSubTab] = useState<"project" | "behavioral" | "recruiting">("project");

  // 1. Project Stages State
  const [stages, setStages] = useState<ProjectStageItem[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [stageNotes, setStageNotes] = useState("");
  const [stageRepoUrl, setStageRepoUrl] = useState("");

  // 2. STAR Stories State
  const [starStories, setStarStories] = useState<StarStoryItem[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [showAddStory, setShowAddStory] = useState(false);
  const [newCategory, setNewCategory] = useState("Conflict / Collaboration");
  const [newQuestion, setNewQuestion] = useState("");
  const [newSituation, setNewSituation] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newAction, setNewAction] = useState("");
  const [newResult, setNewResult] = useState("");
  const [newConfidence, setNewConfidence] = useState(4);

  // 3. Recruiting & Applications State
  const [checklist, setChecklist] = useState<RecruitingChecklist[]>([]);
  const [applications, setApplications] = useState<JobApp[]>([]);
  const [loadingRecruiting, setLoadingRecruiting] = useState(false);
  const [showAddApp, setShowAddApp] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newPosition, setNewPosition] = useState("Software Engineering Intern (Summer 2027)");
  const [newLocation, setNewLocation] = useState("Dallas, TX (Hybrid)");
  const [newAppStatus, setNewAppStatus] = useState("Applied");
  const [newAppUrl, setNewAppUrl] = useState("");

  // Fetch functions
  const fetchStages = async () => {
    setLoadingStages(true);
    try {
      const res = await fetch("/api/project/stages");
      if (res.ok) {
        const data = await res.json();
        setStages(data);
      }
    } catch (err) {
      console.error("Failed to load stages:", err);
    } finally {
      setLoadingStages(false);
    }
  };

  const fetchStories = async () => {
    setLoadingStories(true);
    try {
      const res = await fetch("/api/star-stories");
      if (res.ok) {
        const data = await res.json();
        setStarStories(data);
      }
    } catch (err) {
      console.error("Failed to load STAR stories:", err);
    } finally {
      setLoadingStories(false);
    }
  };

  const fetchRecruiting = async () => {
    setLoadingRecruiting(true);
    try {
      const res = await fetch("/api/recruiting");
      if (res.ok) {
        const data = await res.json();
        setChecklist(data.checklist || []);
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to load recruiting data:", err);
    } finally {
      setLoadingRecruiting(false);
    }
  };

  useEffect(() => {
    fetchStages();
    fetchStories();
    fetchRecruiting();
  }, []);

  // Handlers for Project Stages
  const handleToggleStage = async (stage: ProjectStageItem) => {
    try {
      const res = await fetch("/api/project/stages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: stage.id,
          isCompleted: !stage.isCompleted,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStages((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      }
    } catch (err) {
      console.error("Failed to toggle stage:", err);
    }
  };

  const handleSaveStageMeta = async (id: string) => {
    try {
      const res = await fetch("/api/project/stages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          notes: stageNotes,
          repoUrl: stageRepoUrl,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStages((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setEditingStageId(null);
      }
    } catch (err) {
      console.error("Failed to save stage metadata:", err);
    }
  };

  // Handlers for STAR Stories
  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion || !newSituation || !newAction || !newResult) return;

    try {
      const res = await fetch("/api/star-stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCategory,
          question: newQuestion,
          situation: newSituation,
          task: newTask,
          action: newAction,
          result: newResult,
          confidence: newConfidence,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setStarStories((prev) => [created, ...prev]);
        setShowAddStory(false);
        setNewQuestion("");
        setNewSituation("");
        setNewTask("");
        setNewAction("");
        setNewResult("");
      }
    } catch (err) {
      console.error("Failed to add STAR story:", err);
    }
  };

  const handleDeleteStory = async (id: string) => {
    try {
      const res = await fetch(`/api/star-stories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStarStories((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete story:", err);
    }
  };

  // Handlers for Recruiting & Applications
  const handleToggleChecklist = async (item: RecruitingChecklist) => {
    try {
      const res = await fetch("/api/recruiting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "checklistItem",
          id: item.id,
          isCompleted: !item.isCompleted,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setChecklist((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      }
    } catch (err) {
      console.error("Failed to toggle checklist:", err);
    }
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany) return;

    try {
      const res = await fetch("/api/recruiting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "application",
          company: newCompany,
          position: newPosition,
          location: newLocation,
          status: newAppStatus,
          jobUrl: newAppUrl,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setApplications((prev) => [created, ...prev]);
        setShowAddApp(false);
        setNewCompany("");
        setNewAppUrl("");
      }
    } catch (err) {
      console.error("Failed to add application:", err);
    }
  };

  const handleDeleteApp = async (id: string) => {
    try {
      const res = await fetch(`/api/recruiting?id=${id}&type=application`, { method: "DELETE" });
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete application:", err);
    }
  };

  const handleUpdateAppStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/recruiting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "application",
          id,
          status: newStatus,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Handbook Sections 5, 6 & 7
              </span>
              <span className="text-xs text-slate-400">
                UNT CS Junior &bull; F-1 Visa &bull; Summer 2027 Internship
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Backend Project, STAR Bank & F-1 Recruiting
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Backed by PostgreSQL persistence: Track your Campus Task Tracker API milestones, save your personal STAR behavioral interview stories, and manage real Summer 2027 internship applications.
            </p>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveSubTab("project")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "project"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Campus Task Tracker API
          </button>
          <button
            onClick={() => setActiveSubTab("behavioral")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "behavioral"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            STAR Behavioral Bank ({starStories.length})
          </button>
          <button
            onClick={() => setActiveSubTab("recruiting")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "recruiting"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Recruiting & Applications ({applications.length})
          </button>
        </div>
      </div>

      {/* 1. Backend Project Plan (Campus Task Tracker API) */}
      {activeSubTab === "project" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div>
                <h2 className="text-lg font-bold text-white">Campus Task Tracker API Scope Ladder</h2>
                <p className="text-xs text-slate-400">
                  Handbook Section 5: Step-by-step implementation milestones saved directly to PostgreSQL.
                </p>
              </div>
              <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                {stages.filter((s) => s.isCompleted).length} of {stages.length} Milestones Completed
              </div>
            </div>

            {loadingStages ? (
              <div className="flex items-center justify-center p-8 text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading project stages from database...
              </div>
            ) : (
              <div className="space-y-4">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className={`p-4 rounded-xl border transition-all ${
                      stage.isCompleted
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-slate-950/60 border-slate-800"
                    } space-y-3`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleStage(stage)}
                          className="mt-0.5 cursor-pointer text-slate-400 hover:text-emerald-400 transition"
                        >
                          {stage.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                        <div>
                          <h3
                            className={`text-sm font-bold ${
                              stage.isCompleted ? "text-emerald-300 line-through" : "text-white"
                            }`}
                          >
                            {stage.title}
                          </h3>
                          <p className="text-xs text-slate-300 mt-0.5">{stage.focus}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setEditingStageId(stage.id === editingStageId ? null : stage.id);
                          setStageNotes(stage.notes || "");
                          setStageRepoUrl(stage.repoUrl || "");
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Stage Notes & Repo Link"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-lg text-xs text-slate-400 border border-slate-800">
                      <strong className="text-purple-300">Interview Proof Criterion:</strong>{" "}
                      {stage.proofRequirements}
                    </div>

                    {/* Metadata view / edit */}
                    {editingStageId === stage.id ? (
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-2.5 pt-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            GitHub Repository / Commit URL
                          </label>
                          <input
                            type="url"
                            placeholder="https://github.com/barun/campus-task-tracker"
                            value={stageRepoUrl}
                            onChange={(e) => setStageRepoUrl(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Stage Notes & Demonstration Talking Points
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Implemented Task entity with equals/hashCode and test invariants..."
                            value={stageNotes}
                            onChange={(e) => setStageNotes(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingStageId(null)}
                            className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveStageMeta(stage.id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                          >
                            Save Details
                          </button>
                        </div>
                      </div>
                    ) : (
                      (stage.notes || stage.repoUrl) && (
                        <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-slate-800/80">
                          {stage.repoUrl && (
                            <a
                              href={stage.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-purple-400 hover:underline"
                            >
                              <LinkIcon className="w-3 h-3" />
                              <span>View Code Commit</span>
                            </a>
                          )}
                          {stage.notes && <span className="text-slate-400 italic">{stage.notes}</span>}
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. STAR Behavioral Question Bank */}
      {activeSubTab === "behavioral" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Authentic STAR Behavioral Question Bank</h2>
              <p className="text-xs text-slate-400">
                Structure: Situation (15%), Task (15%), Action (50%), Result (20%). Stored in PostgreSQL.
              </p>
            </div>
            <button
              onClick={() => setShowAddStory(!showAddStory)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom STAR Story</span>
            </button>
          </div>

          {/* Add story form */}
          {showAddStory && (
            <form onSubmit={handleAddStory} className="bg-slate-950 p-5 rounded-2xl border border-purple-500/30 space-y-3.5 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-purple-300">New STAR Interview Story</h3>
                <button
                  type="button"
                  onClick={() => setShowAddStory(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Conflict / Collaboration">Conflict / Collaboration</option>
                    <option value="Failure / Resilience">Failure / Resilience</option>
                    <option value="Ambiguity / Leadership">Ambiguity / Leadership</option>
                    <option value="Technical Tradeoff">Technical Tradeoff</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confidence (1 to 5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Behavioral Question</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tell me about a time you optimized a slow algorithm."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Situation (15%)</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Context, coursework, team setting, constraints..."
                    value={newSituation}
                    onChange={(e) => setNewSituation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Task (15%)</label>
                  <textarea
                    rows={2}
                    placeholder="What specific responsibility did you own?"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Action (50%)</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="What concrete engineering decisions and steps did you take?"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Result (20%)</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Measurable outcome, latency reduction, lessons learned..."
                    value={newResult}
                    onChange={(e) => setNewResult(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                >
                  Save STAR Story
                </button>
              </div>
            </form>
          )}

          {loadingStories ? (
            <div className="flex items-center justify-center p-8 text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading behavioral bank...
            </div>
          ) : (
            <div className="space-y-4">
              {starStories.map((story) => (
                <div key={story.id} className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {story.category}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1">{story.question}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-400" title={`Confidence: ${story.confidence}/5`}>
                        {Array.from({ length: story.confidence }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      {story.isCustom && (
                        <button
                          onClick={() => handleDeleteStory(story.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="Delete story"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                      <span className="font-bold text-slate-400 block mb-1">Situation & Task:</span>
                      <p className="text-slate-300">{story.situation}</p>
                      {story.task && <p className="text-slate-400 mt-1 italic">{story.task}</p>}
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                      <span className="font-bold text-emerald-400 block mb-1">Action & Result:</span>
                      <p className="text-slate-300">{story.action}</p>
                      <p className="text-emerald-300 mt-1 font-semibold">{story.result}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Recruiting & F-1 / CPT Checklist & Applications */}
      {activeSubTab === "recruiting" && (
        <div className="space-y-6">
          {/* Checklist Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Summer 2027 CPT Regulatory & Preparation Checklist</h2>
              <p className="text-xs text-slate-400">
                Interactive verification checklist for University of North Texas international CS students.
              </p>
            </div>

            <div className="space-y-2.5">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    item.isCompleted
                      ? "bg-emerald-950/20 border-emerald-500/30 text-slate-400"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200"
                  }`}
                >
                  <button type="button" className="mt-0.5 pointer-events-none">
                    {item.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                  <div className="flex-1 text-xs">
                    <span className="font-semibold block">{item.title}</span>
                    {item.detail && <span className="text-[11px] text-slate-400">{item.detail}</span>}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Job Applications Tracker Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div>
                <h2 className="text-lg font-bold text-white">Summer 2027 Internship Application Tracker</h2>
                <p className="text-xs text-slate-400">
                  Track applied companies, OA dates, and interview stages with PostgreSQL persistence.
                </p>
              </div>
              <button
                onClick={() => setShowAddApp(!showAddApp)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Application</span>
              </button>
            </div>

            {/* Add Application Form */}
            {showAddApp && (
              <form onSubmit={handleAddApplication} className="bg-slate-950 p-4 rounded-xl border border-purple-500/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Company</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. JPMorgan Chase, TI, Capital One"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                    <input
                      type="text"
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                    <select
                      value={newAppStatus}
                      onChange={(e) => setNewAppStatus(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Online Assessment">Online Assessment</option>
                      <option value="Technical Screen">Technical Screen</option>
                      <option value="Final Round">Final Round</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="Plano, TX / Remote"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Posting URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newAppUrl}
                      onChange={(e) => setNewAppUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddApp(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
                  >
                    Save Application
                  </button>
                </div>
              </form>
            )}

            {/* Applications Table */}
            {applications.length === 0 ? (
              <div className="text-center p-8 text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                No applications logged yet. Click "Log New Application" above to track your Summer 2027 job search!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Date Applied</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{app.company}</span>
                          {app.jobUrl && (
                            <a href={app.jobUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{app.position}</td>
                        <td className="py-2.5 px-3">
                          <select
                            value={app.status}
                            onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Online Assessment">Online Assessment</option>
                            <option value="Technical Screen">Technical Screen</option>
                            <option value="Final Round">Final Round</option>
                            <option value="Offer">Offer</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{app.dateApplied}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteApp(app.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
