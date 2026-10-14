# 180-Day Software Engineering Interview Preparation Tracker

A complete, responsive, full-stack application built for a Computer Science junior at the **University of North Texas (UNT)** studying on an **F-1 student visa** and preparing for **Summer 2027 Software Engineering Internships**.

This application directly digitizes the **180-Day Software Engineering Interview Preparation Handbook**, turning its exact day-by-day curriculum into actionable tasks, persistent timers, intelligent carryover workload management, active recall ledgers, and verified accountability reports.

---

## 📅 Program Specifications

- **Program Start:** Wednesday, October 14, 2026 (Day 1)
- **Program End:** Sunday, April 11, 2027 (Day 180)
- **Total Duration:** Exactly 180 days across 26 weeks
- **Daily Minimum Focus:** 3 hours (180 minutes) per day
- **Weekly Target:** 21.0 hours per week
- **Total Planned Study Time:** 540 focused hours
- **Candidate Context:** UNT CS Junior, F-1 Visa, Summer 2027 SWE Internship

---

## 🚀 Key Features

### 1. Interactive Daily Checklist
- Complete, non-generic schedule for all 180 days extracted directly from the handbook PDF.
- Categorized by:
  - Java and Data Structures & Algorithms
  - LeetCode Practice
  - Spaced-Repetition Reviews
  - Computer Science Fundamentals
  - System Design
  - Backend Project Development (Campus Task Tracker API)
  - Behavioral Interview Preparation (STAR Method)
  - Resume & F-1/CPT Recruiting
  - Weekly / Monthly Milestone Assessments
- Independent task checking, duration editing, LeetCode deep links, exit deliverable checks, and mistake logging.

### 2. Persistent Study Timer & Session Logger
- Real study timer with **Start**, **Pause**, **Resume**, **Stop**, and **Reset** (with confirmation).
- Uses timestamp-based elapsed time calculations: active study time survives page refreshes, browser reloads, and tab navigation.
- **Paused time is strictly excluded** from study hours.
- Manual session logger with audit trail for time adjustments.
- Task-specific attribution: study sessions directly increment task and daily actual minutes.

### 3. Smart Task Carryover & Workload Balancer
- **Partial Carryover:** Transfer only unfinished minutes (e.g., 60m task with 45m spent transfers only 15m).
- **History Preservation:** Keeps spent study time attached to the original date; does not rewrite historical adherence.
- **Workload Balancer:** Evaluates tomorrow's proposed workload (e.g., 180m original + 60m carried = 240m).
- **Overload Warnings:** Alerts when workload exceeds 3 hours, offering extended sessions or task prioritization.
- **Reversible:** Carryover history ledger includes an **Undo** action that restores unfinished work if not yet completed on the target day.
- **Duplicate Prevention:** Transaction-safe carryovers prevent accidental duplicate transfers.

### 4. Spaced-Repetition Engine (R0–R60)
- Review dates calculated strictly from the **original learning date**:
  - **R0:** Original date
  - **R1:** +1 day
  - **R3:** +3 days
  - **R7:** +7 days
  - **R14:** +14 days
  - **R30:** +30 days
  - **R60:** +60 days
- Supports mastery ratings: **Strong**, **Needs Practice**, or **Relearn**.
- Automatically schedules a **next-day repair review** for items needing practice without altering the original schedule.
- Filter queues by **Due Today**, **Overdue**, **Upcoming**, and **Completed Ledger**.
- Built-in 5-step active recall protocol guide from Handbook Section 3.

### 5. Accountability Partner & Verified Report Delivery
- Generates **Daily**, **Weekly**, and **Monthly** activity reports using **actual recorded numbers**.
- Dual format: Rich visual dashboard views, formatted Markdown, and styled HTML emails.
- Delivery options:
  - **Resend HTTP API** (instant, token-based)
  - **Standard SMTP / Nodemailer** (Mailgun, Gmail, SendGrid, etc.)
- **No False Deliveries:** If no provider credentials are configured, reports can be previewed or copied, and the system displays a clear setup message rather than claiming success.
- Comprehensive delivery audit log tracking timestamps, recipient emails, report types, and delivery status.

### 6. Campus Task Tracker API & STAR Behavioral Bank
- **Backend Project Plan:** 5-stage scope ladder for the Campus Task Tracker API (Java basics, In-Memory REST, PostgreSQL JPA, JUnit 5 Mockito, Docker).
- **STAR Behavioral Bank:** Structured answers and talking points for core engineering behavioral questions.
- **F-1 / CPT Checklist:** Summer 2027 application cadence and UNT International Student Office CPT regulations.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti
- **Backend:** Next.js API Routes (Route Handlers)
- **Database & ORM:** SQLite with Prisma ORM (`dev.db`, easily switchable to PostgreSQL via `DATABASE_URL`)
- **Testing:** Vitest automated test suite (16 comprehensive scenarios)
- **Email Delivery:** Nodemailer & Resend HTTP API

---

## 🏁 Quickstart Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

To enable real accountability email delivery, supply either a Resend API key or SMTP credentials:
```env
DATABASE_URL="file:./dev.db"

# Option A: Resend API Key
RESEND_API_KEY="re_xxxxxxxxxxxxxx"

# Option B: Standard SMTP Credentials
# SMTP_HOST="smtp.mailgun.org"
# SMTP_PORT=587
# SMTP_USER="postmaster@yourdomain.com"
# SMTP_PASS="secret_password"
# SMTP_FROM="Interview Tracker <noreply@yourdomain.com>"
```

### 3. Initialize & Seed Database
The seeder parses the 180-day handbook PDF and populates all 180 study days, 900 tasks, and 965 spaced review intervals:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. Run Automated Test Suite
```bash
npm test
```
Verifies all 16 core requirements including 180-day calendar math, timer pause exclusion, partial carryover calculation, spaced repetition offsets, and email delivery rules.

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Test Scenarios

The automated test suite (`tests/interview-tracker.test.ts`) verifies:
1. Program contains exactly 180 days with correct calendar dates.
2. Day 1 is Wednesday, October 14, 2026.
3. Day 180 is Sunday, April 11, 2027.
4. Task timer records elapsed active time correctly.
5. Paused timer time is strictly excluded.
6. Timer state survives browser reloads and tab refreshes.
7. Partially completed 60m task with 45m spent leaves 15m remaining.
8. Carryover creates exactly 15m remaining work, not a duplicate 60m task.
9. Original task history and spent study time are preserved.
10. Duplicate carryovers to the same target date are prevented.
11. Tomorrow's workload includes carryover and flags > 3-hour overload.
12. Rescheduling updates future workload without overwriting schedule adherence.
13. Spaced-repetition dates (R1, R3, R7, R14, R30, R60) derive from the original learning date.
14. Daily and weekly reports compute from real saved database records.
15. Scheduled emails require explicit user consent and configured credentials.
16. Unconfigured email delivery reports failures accurately without false claims.

---

## 🔒 Security & Data Integrity

- API keys and email secrets are stored exclusively on the server side (`.env` and secure database records).
- All carryovers and undos execute inside **database transactions** (`prisma.$transaction`) to prevent orphan tasks or inconsistent schedules.
- JSON database backups can be exported at any time from **Settings & Backup**.
