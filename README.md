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

## 🛠️ Tech Stack & Architecture

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Canvas Confetti
- **Backend:** Next.js Route Handlers (`src/app/api/`)
- **Database & ORM:** PostgreSQL with Prisma ORM (`postgresql://barun:...@192.168.68.61:5433/barun_db`)
- **Authentication:** BCrypt password hashing, signed JWT session tokens, and HTTP-only SameSite cookies
- **Testing:** Vitest automated test suite (26 comprehensive scenarios)
- **Email Delivery:** Nodemailer & Resend HTTP API

---

## 🗄️ PostgreSQL Database Configuration

### Connection Specification
- **Database Engine:** PostgreSQL 16
- **Database Name:** `barun_db`
- **Username:** `barun`
- **Host:** `192.168.68.61`
- **Port:** `5433`

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set the database connection string in `.env`:
```env
DATABASE_URL="postgresql://barun:YOUR_PASSWORD@192.168.68.61:5433/barun_db?schema=public"

# Explicit Connection Settings
DB_HOST="192.168.68.61"
DB_PORT=5433
DB_NAME="barun_db"
DB_USERNAME="barun"
DB_PASSWORD="YOUR_PASSWORD"

# Authentication
JWT_SECRET="your-32-character-secret-key-for-jwt-signing"
AUTH_COOKIE_NAME="auth_token"
```

### Remote Connection Diagnostic
- Network ping to `192.168.68.61` succeeds (~4-6ms latency).
- Port 5433 connection returned `ECONNREFUSED` because the PostgreSQL service/Docker container on the remote Ubuntu server is stopped.
- **Remediation:** On the Ubuntu host (`192.168.68.61`), start the PostgreSQL container:
  ```bash
  docker start <container_name_or_id>
  # or launch a fresh container mapping 5433:5432
  docker run -d --name barun_db -p 5433:5432 -e POSTGRES_USER=barun -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=barun_db postgres:16
  ```
- Use the built-in health check endpoint `GET /api/health` to verify live connectivity.

---

## 🔐 Complete Authentication System

A production-minded email & password authentication architecture:

1. **Sign Up (`POST /api/auth/register`):**
   - Normalizes email addresses consistently (case-insensitive lowercase).
   - Validates email syntax and confirms password match.
   - Enforces password strength (min 8 characters, numbers/special characters).
   - Hashes passwords using BCrypt with 10 salt rounds (never plaintext).
   - Prevents duplicate accounts with HTTP 409 Conflict.
   - Automatically provisions student profile (UNT, F-1 Visa, Target Role).
   - Issues HTTP-only session cookie.

2. **Sign In (`POST /api/auth/login`):**
   - Verifies credentials against PostgreSQL using BCrypt comparison.
   - Returns generic `Invalid email or password` error to prevent credential enumeration.
   - Protects against brute-force attacks via sliding window rate limiting.
   - Issues signed JWT in an HTTP-only, `SameSite=Lax` cookie.

3. **Sign Out (`POST /api/auth/logout`):**
   - Invalidates and expires the HTTP-only authentication cookie immediately.

4. **Session Restoration (`GET /api/auth/me`):**
   - Verifies JWT cookie and restores student profile across reloads and browser refreshes.

5. **Forgot & Reset Password:**
   - `POST /api/auth/forgot-password`: Issues a 64-character single-use token expiring in 1 hour.
   - `POST /api/auth/reset-password`: Validates token, hashes new password, and invalidates the token.

---

## 📦 Real PostgreSQL Data Persistence (Dummy Data Replaced)

All hardcoded dummy arrays have been replaced with real database entities and full CRUD endpoints:

| Feature Area | Previous State | Current PostgreSQL Entity & API |
| :--- | :--- | :--- |
| **Campus Task Tracker API** | Hardcoded array of 5 stages | `ProjectStage` entity with `GET` and `PATCH /api/project/stages` for completion, notes, and repo links |
| **STAR Behavioral Bank** | Static handbook questions | `StarStory` entity with `GET`, `POST`, `PUT`, `DELETE /api/star-stories` for custom stories & confidence ratings |
| **F-1 / CPT Checklist** | Static checklist | `RecruitingChecklistItem` entity with `GET`, `POST`, `PATCH /api/recruiting` |
| **Internship Applications** | None (untracked) | `JobApplication` entity with full CRUD tracking company, role, location, status, date applied, and URLs |
| **Student Profile** | Hardcoded UI text | `User` profile dynamically fetched and editable via `GET` / `PUT /api/user/profile` |

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

## 🧪 Automated Test Scenarios (26/26 Passing)

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
16. Failed or unconfigured email delivery is reported accurately without false success.
17. Validates email format and normalizes consistently.
18. Enforces reasonable password-strength requirements.
19. BCrypt produces secure salted hashes and verifies credentials correctly.
20. JWT tokens carry claims, verify signatures, and reject tampering.
21. Authentication cookie name is standardized.
22. Expired password reset tokens are invalidated.
23. Failed login mitigation detects repeated failures.
24. Queries enforce strict user isolation for private data.
25. Password hash is strictly excluded from returned user profiles.
26. Duplicate email addresses are rejected with conflict error.

---

## 🔒 Security & Data Integrity

- Passwords hashed using BCrypt (10 salt rounds); plaintext passwords never stored or logged.
- HTTP-only, SameSite=Lax authentication cookies protect against XSS and CSRF token extraction.
- Password hashes and reset tokens are strictly excluded from all public API projections.
- Brute-force rate limiting protects login endpoints against automated credential guessing.
- Single-use, 1-hour expiration tokens protect password resets.
- Multi-tenant data isolation ensures users only access their own private records.
- All carryovers and undos execute inside **database transactions** (`prisma.$transaction`) to prevent orphan tasks or inconsistent schedules.
- JSON database backups can be exported at any time from **Settings & Backup**.
