"use client";

import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { TimerProvider } from "@/lib/timer-context";
import { Navbar, ActiveTab } from "@/components/Navbar";
import { TimerFloatingBar } from "@/components/TimerFloatingBar";
import { AuthModal } from "@/components/AuthModal";
import { DashboardView } from "@/components/DashboardView";
import { TodayChecklistView } from "@/components/TodayChecklistView";
import { CarryoverPlannerView } from "@/components/CarryoverPlannerView";
import { SpacedRepetitionView } from "@/components/SpacedRepetitionView";
import { CalendarView } from "@/components/CalendarView";
import { CurriculumExplorerView } from "@/components/CurriculumExplorerView";
import { ReportsView } from "@/components/ReportsView";
import { ProjectRecruitingView } from "@/components/ProjectRecruitingView";
import { AccountabilitySettingsView } from "@/components/AccountabilitySettingsView";
import { SettingsView } from "@/components/SettingsView";
import { StudyDayDTO } from "@/lib/types";

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [currentDay, setCurrentDay] = useState<StudyDayDTO | null>(null);
  const [curriculumOverview, setCurriculumOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchDayData = async (dayNum: number) => {
    try {
      const res = await fetch(`/api/days?dayNumber=${dayNum}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentDay(data);
        setLoadError(null);
      } else {
        const errData = await res.json().catch(() => null);
        setLoadError(errData?.error || `Failed to retrieve study day (${res.status})`);
      }
    } catch (err: any) {
      console.error("Failed to load day:", err);
      setLoadError("Network error: Could not connect to API server.");
    }
  };

  const fetchCurriculumOverview = async () => {
    try {
      const res = await fetch("/api/curriculum");
      if (res.ok) {
        const data = await res.json();
        setCurriculumOverview(data);
      }
    } catch (err) {
      console.error("Failed to load curriculum overview:", err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    Promise.all([fetchDayData(selectedDayNumber), fetchCurriculumOverview()]).finally(() =>
      setIsLoading(false)
    );
  }, [selectedDayNumber]);

  const handleRefreshData = () => {
    setIsLoading(true);
    setLoadError(null);
    Promise.all([fetchDayData(selectedDayNumber), fetchCurriculumOverview()]).finally(() =>
      setIsLoading(false)
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedDayNumber={selectedDayNumber}
        setSelectedDayNumber={setSelectedDayNumber}
        todayActualMinutes={currentDay?.actualMinutes || 0}
        todayPlannedMinutes={currentDay?.totalPlannedMinutes || 180}
      />

      {/* Main Container View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24">
        {activeTab === "dashboard" && (
          <DashboardView
            currentDay={currentDay}
            curriculumOverview={curriculumOverview}
            onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
            onSelectDay={setSelectedDayNumber}
            onRefreshData={handleRefreshData}
            isLoading={isLoading}
            loadError={loadError}
          />
        )}

        {activeTab === "checklist" && currentDay && (
          <TodayChecklistView
            currentDay={currentDay}
            onRefreshDay={handleRefreshData}
            onOpenCarryover={() => setActiveTab("carryover")}
          />
        )}

        {activeTab === "carryover" && currentDay && (
          <CarryoverPlannerView
            currentDay={currentDay}
            onRefreshData={handleRefreshData}
            onSelectDay={setSelectedDayNumber}
          />
        )}

        {activeTab === "spaced-rep" && (
          <SpacedRepetitionView
            currentDate={currentDay?.date || "2026-10-14"}
            onRefreshData={handleRefreshData}
          />
        )}

        {activeTab === "calendar" && (
          <CalendarView
            onSelectDay={setSelectedDayNumber}
            onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
          />
        )}

        {activeTab === "curriculum" && (
          <CurriculumExplorerView
            onSelectDay={setSelectedDayNumber}
            onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
          />
        )}

        {activeTab === "reports" && (
          <ReportsView
            currentDayNumber={selectedDayNumber}
            onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
          />
        )}

        {activeTab === "project-recruiting" && <ProjectRecruitingView />}

        {activeTab === "accountability" && <AccountabilitySettingsView />}

        {activeTab === "settings" && <SettingsView />}
      </main>

      {/* Persistent Active Study Timer Floating Dock */}
      <TimerFloatingBar onSessionSaved={handleRefreshData} />

      {/* Global Authentication Modal */}
      <AuthModal />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <p>
            180-Day Software Engineering Interview Preparation Handbook &bull; Summer 2027 SWE Recruiting
          </p>
          <p className="font-mono text-slate-400">
            540 Hours &bull; 21h / Week &bull; 3h Daily Focus
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <TimerProvider>
        <MainApp />
      </TimerProvider>
    </AuthProvider>
  );
}
