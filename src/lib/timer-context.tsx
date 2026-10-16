"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ActiveTimerState } from "./types";
import { calculateElapsedSeconds } from "./calculations";
import confetti from "canvas-confetti";

interface TimerContextType {
  timer: ActiveTimerState;
  elapsedSeconds: number;
  formattedTime: string;
  startTimer: (task: { id: string; title: string; category: string; studyDayId: string; dayNumber: number }) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (notes?: string) => Promise<{ success: boolean; activeMinutes: number }>;
  resetTimer: () => void;
  triggerConfetti: () => void;
}

const initialTimerState: ActiveTimerState = {
  isRunning: false,
  isPaused: false,
  taskId: null,
  taskTitle: null,
  taskCategory: null,
  studyDayId: null,
  dayNumber: null,
  sessionId: null,
  startTimestamp: null,
  sessionStartTimestamp: null,
  accumulatedSeconds: 0,
  lastPausedTimestamp: null,
};

const TimerContext = createContext<TimerContextType | null>(null);

const STORAGE_KEY = "swe_interview_tracker_timer_state";

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useState<ActiveTimerState>(initialTimerState);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Load persisted timer state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ActiveTimerState = JSON.parse(saved);
        setTimer(parsed);
        setElapsedSeconds(calculateElapsedSeconds(parsed, Date.now()));
      }
    } catch (e) {
      console.error("Failed to load timer from localStorage:", e);
    }
  }, []);

  // Persist timer state whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
    } catch (e) {
      console.error("Failed to persist timer state:", e);
    }
  }, [timer]);

  // Tick effect: updates elapsed time every second while running
  useEffect(() => {
    if (!timer.isRunning || timer.isPaused) {
      setElapsedSeconds(timer.accumulatedSeconds);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsedSeconds(timer, Date.now()));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // safe fallback
    }
  }, []);

  const startTimer = useCallback(
    (task: { id: string; title: string; category: string; studyDayId: string; dayNumber: number }) => {
      const now = Date.now();
      const newState: ActiveTimerState = {
        isRunning: true,
        isPaused: false,
        taskId: task.id,
        taskTitle: task.title,
        taskCategory: task.category,
        studyDayId: task.studyDayId,
        dayNumber: task.dayNumber,
        sessionId: `sess_${now}`,
        startTimestamp: now,
        sessionStartTimestamp: now,
        accumulatedSeconds: 0,
        lastPausedTimestamp: null,
      };
      setTimer(newState);
      setElapsedSeconds(0);
    },
    []
  );

  const pauseTimer = useCallback(() => {
    if (!timer.isRunning || timer.isPaused) return;
    const now = Date.now();
    const currentActiveSeconds = calculateElapsedSeconds(timer, now);

    setTimer((prev) => ({
      ...prev,
      isPaused: true,
      accumulatedSeconds: currentActiveSeconds,
      startTimestamp: null,
      lastPausedTimestamp: now,
    }));
    setElapsedSeconds(currentActiveSeconds);
  }, [timer]);

  const resumeTimer = useCallback(() => {
    if (!timer.isRunning || !timer.isPaused) return;
    const now = Date.now();

    setTimer((prev) => ({
      ...prev,
      isPaused: false,
      startTimestamp: now,
      lastPausedTimestamp: null,
    }));
  }, [timer]);

  const resetTimer = useCallback(() => {
    setTimer(initialTimerState);
    setElapsedSeconds(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const stopTimer = useCallback(
    async (notes?: string) => {
      const now = Date.now();
      const activeSec = calculateElapsedSeconds(timer, now);
      const activeMin = activeSec >= 15 ? Math.max(1, Math.round(activeSec / 60)) : Math.round(activeSec / 60);

      if (activeSec > 0 && timer.taskId) {
        try {
          const sessionStart = timer.sessionStartTimestamp
            ? new Date(timer.sessionStartTimestamp)
            : new Date(now - activeSec * 1000);
          const sessionEnd = new Date(now);
          const wallElapsedSec = Math.max(activeSec, Math.round((sessionEnd.getTime() - sessionStart.getTime()) / 1000));
          const pausedSec = Math.max(0, wallElapsedSec - activeSec);

          await fetch("/api/timer/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scheduledTaskId: timer.taskId,
              studyDayId: timer.studyDayId,
              startTime: sessionStart.toISOString(),
              endTime: sessionEnd.toISOString(),
              elapsedSeconds: wallElapsedSec,
              activeSeconds: activeSec,
              pausedSeconds: pausedSec,
              notes: notes || "Timer study session",
              isManual: false,
            }),
          });

          if (activeMin >= 30) {
            triggerConfetti();
          }
        } catch (err) {
          console.error("Failed to save session:", err);
        }
      }

      resetTimer();
      return { success: true, activeMinutes: activeMin };
    },
    [timer, resetTimer, triggerConfetti]
  );

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, "0");
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <TimerContext.Provider
      value={{
        timer,
        elapsedSeconds,
        formattedTime: formatTime(elapsedSeconds),
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
        triggerConfetti,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
