"use client";

import React, { useState } from "react";
import {
  Code2,
  Users,
  Briefcase,
  CheckCircle2,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export function ProjectRecruitingView() {
  const [activeSubTab, setActiveSubTab] = useState<"project" | "behavioral" | "recruiting">("project");

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
              Authentic materials from your handbook: Build the Campus Task Tracker API, master STAR behavioral stories, and navigate Summer 2027 CPT requirements.
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
            STAR Behavioral Bank
          </button>
          <button
            onClick={() => setActiveSubTab("recruiting")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "recruiting"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Recruiting & F-1/CPT Checklist
          </button>
        </div>
      </div>

      {/* 1. Backend Project Plan (Campus Task Tracker API) */}
      {activeSubTab === "project" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">Campus Task Tracker API Scope Ladder</h2>
              <p className="text-xs text-slate-400">
                Handbook Section 5: Build from your own understanding without buzzwords or fake AI features.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  stage: "Stage 1: Core Java Domain Model",
                  focus: "Task class, status enum (PENDING, IN_PROGRESS, COMPLETED), due date validation, unit tests.",
                  proof: "Explain class invariants, equals/hashCode contracts, and object references without notes.",
                },
                {
                  stage: "Stage 2: In-Memory Spring Boot REST API",
                  focus: "Controllers, service layer, DTOs, GET /tasks, POST /tasks, PUT /tasks/{id}, DELETE /tasks/{id}.",
                  proof: "Curl test all HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found.",
                },
                {
                  stage: "Stage 3: PostgreSQL Database & Spring Data JPA",
                  focus: "Postgres schema, JPA entities, repositories, foreign keys, @Transactional boundary handling.",
                  proof: "Explain database indexing, connection pooling, and why transactions prevent race conditions.",
                },
                {
                  stage: "Stage 4: Automated Testing with JUnit 5 & Mockito",
                  focus: "Unit tests for business logic, integration tests for endpoints using WebMvcTest.",
                  proof: "Demonstrate test coverage for edge cases: empty strings, past due dates, nonexistent task IDs.",
                },
                {
                  stage: "Stage 5: Packaging & Docker Deployment",
                  focus: "Dockerfile, multi-stage build, docker-compose with PostgreSQL, production README.",
                  proof: "Spin up a clean environment with `docker compose up` and demo live curl requests.",
                },
              ].map((step, idx) => (
                <div key={idx} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      {step.stage}
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Phase 5 Milestone
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{step.focus}</p>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg text-xs text-slate-400 border border-slate-800">
                    <strong className="text-purple-300">Interview Proof Criterion:</strong> {step.proof}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. STAR Behavioral Question Bank */}
      {activeSubTab === "behavioral" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">Authentic STAR Behavioral Question Bank</h2>
            <p className="text-xs text-slate-400">
              Situation (15%), Task (15%), Action (50%), Result (20%). Aim for 90–120 seconds. Never invent leadership metrics.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "1. Tell me about yourself.",
                advice: "Connect your UNT CS coursework, personal Java project building, and specific Summer 2027 internship goals.",
                points: ["Junior at UNT studying CS", "Strong Java foundations and system fundamentals", "Built Campus Task Tracker API", "Looking for high-impact Summer 2027 SWE internship"],
              },
              {
                q: "2. Tell me about a time you faced a technical disagreement in a project.",
                advice: "Focus on facts, benchmarking trade-offs, and mutual team goals rather than personal ego.",
                points: ["Debated SQL vs In-Memory storage", "Created a small prototype benchmark", "Agreed on schema trade-offs collaboratively"],
              },
              {
                q: "3. Describe a challenging bug or roadblock you investigated.",
                advice: "Detail your hypothesis, logging/reproduction steps, root cause discovery, and the lasting test you added.",
                points: ["Encountered unexpected concurrency/race condition", "Used logs and step debugging to isolate state", "Implemented transaction lock and verified with JUnit test"],
              },
              {
                q: "4. Why do you want to intern at this specific company?",
                advice: "Mention one real engineering product or challenge the team solves. Avoid generic compliments.",
                points: ["Specific architecture or scale challenge", "Alignment with your backend/distributed systems interests", "Mentorship and engineering excellence standards"],
              },
            ].map((b, idx) => (
              <div key={idx} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-white">{b.q}</h3>
                <p className="text-xs text-slate-300">{b.advice}</p>
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Key Talking Points:
                  </span>
                  <ul className="text-xs text-slate-300 list-disc list-inside space-y-0.5">
                    {b.points.map((pt, pidx) => (
                      <li key={pidx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Recruiting & F-1 / CPT Checklist */}
      {activeSubTab === "recruiting" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">Summer 2027 Recruiting & F-1 / CPT Timeline</h2>
            <p className="text-xs text-slate-400">
              Guidance for University of North Texas international CS students seeking CPT internship authorization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                F-1 / CPT Regulatory Guidelines
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Maintain valid full-time F-1 student status at UNT for at least one full academic year.</li>
                <li>Internship offer letter must include job description directly related to Computer Science.</li>
                <li>Obtain CPT I-20 authorization from UNT International Student Office BEFORE starting work.</li>
                <li>Working even one day without approved CPT I-20 violates status. Never accept unauthorized start dates.</li>
              </ul>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Summer 2027 Application Cadence
              </h3>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li><strong>Oct &ndash; Nov 2026:</strong> Resume polish, apply on rolling basis as roles open.</li>
                <li><strong>Dec 2026 &ndash; Jan 2027:</strong> Online assessments (OAs) and preliminary phone screens.</li>
                <li><strong>Feb &ndash; Mar 2027:</strong> Final round virtual technical interviews & system design.</li>
                <li><strong>Apr 2027:</strong> Offer evaluation, CPT paperwork submission with UNT.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
