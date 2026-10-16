import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  CheckSquare,
  ArrowRightLeft,
  Repeat,
  Calendar,
  BookOpen,
  FileBarChart2,
  Code2,
  Mail,
  Settings,
  Flame,
  Clock,
  ChevronDown,
  GraduationCap,
  LogIn,
  LogOut,
  User,
  Share2,
  ExternalLink,
} from "lucide-react";

export type ActiveTab =
  | "dashboard"
  | "checklist"
  | "carryover"
  | "spaced-rep"
  | "calendar"
  | "curriculum"
  | "reports"
  | "project-recruiting"
  | "accountability"
  | "settings";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedDayNumber: number;
  setSelectedDayNumber: (day: number) => void;
  todayActualMinutes: number;
  todayPlannedMinutes: number;
}

export function Navbar({
  activeTab,
  setActiveTab,
  selectedDayNumber,
  setSelectedDayNumber,
  todayActualMinutes,
  todayPlannedMinutes,
}: NavbarProps) {
  const { user, logout, setShowAuthModal, setAuthModalMode } = useAuth();

  const actualHours = (todayActualMinutes / 60).toFixed(1);
  const plannedHours = (todayPlannedMinutes / 60).toFixed(1);
  const percent = Math.min(100, Math.round((todayActualMinutes / (todayPlannedMinutes || 180)) * 100));

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "checklist", label: "Daily Checklist", icon: CheckSquare },
    { id: "carryover", label: "Carryover Planner", icon: ArrowRightLeft },
    { id: "spaced-rep", label: "Spaced Repetition", icon: Repeat },
    { id: "calendar", label: "180-Day Calendar", icon: Calendar },
    { id: "curriculum", label: "All 180 Days", icon: BookOpen },
    { id: "reports", label: "Reports & Analytics", icon: FileBarChart2 },
    { id: "project-recruiting", label: "Project & STAR Bank", icon: Code2 },
    { id: "accountability", label: "Accountability Partner", icon: Mail },
    { id: "settings", label: "Settings & Backup", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white">
      {/* Top Banner with Student Profile & Quick Day Jump */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-md shadow-indigo-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                180-Day SWE Interview Prep Tracker
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Summer 2027 SWE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {user ? (
                <>
                  <span className="font-semibold text-slate-200">{user.name}</span> &bull; {user.university} &bull; <span className="text-emerald-400 font-semibold">{user.visaStatus}</span>
                </>
              ) : (
                "Guest Mode \u2022 Sign in to record PostgreSQL progress"
              )}
            </p>
          </div>
        </div>

        {/* Day Selector & Daily Progress */}
        <div className="flex items-center gap-3">
          {/* Day Jump Selector */}
          <div className="relative flex items-center">
            <label htmlFor="day-selector" className="text-xs font-semibold text-slate-400 mr-2 hidden md:inline">
              Active Day:
            </label>
            <div className="relative">
              <select
                id="day-selector"
                value={selectedDayNumber}
                onChange={(e) => setSelectedDayNumber(Number(e.target.value))}
                className="appearance-none bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-semibold text-slate-200 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {Array.from({ length: 180 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d} / 180
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Today's Target Hours Badge */}
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <div className="text-xs">
              <span className="font-bold text-emerald-400">{actualHours}h</span>
              <span className="text-slate-400"> / {plannedHours}h</span>
            </div>
            <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-2.5 py-1.5 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Streak: Day {selectedDayNumber}</span>
          </div>

          {/* Public Share Link */}
          <Link
            href="/share"
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs font-semibold transition cursor-pointer"
            title="Open public shareable view (no login required)"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Public View</span>
            <ExternalLink className="w-3 h-3 text-indigo-400" />
          </Link>

          {/* Auth Controls */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                onClick={() => setActiveTab("settings")}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-300 hover:text-white transition cursor-pointer"
                title={`Signed in as ${user.email}`}
              >
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold hidden lg:inline max-w-[90px] truncate">{user.name.split(" ")[0]}</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <button
                onClick={() => {
                  setAuthModalMode("login");
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
