"use client";

import { useState, useEffect } from "react";

export type ScanHistory = {
  id: string;
  timestamp: number;
  score: number;
  status: "safe" | "unsafe";
  vulnerabilityCount: number;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
};

export type Stats = {
  totalScans: number;
  totalVulnerabilities: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number;
  lastScanDate: number | null;
  achievements: Achievement[];
  scanHistory: ScanHistory[];
};

const INITIAL_STATS: Stats = {
  totalScans: 0,
  totalVulnerabilities: 0,
  averageScore: 0,
  bestScore: 0,
  currentStreak: 0,
  lastScanDate: null,
  achievements: [
    {
      id: "first-scan",
      name: "First Steps",
      description: "Complete your first scan",
      icon: "🎯",
      unlocked: false,
    },
    {
      id: "perfect-score",
      name: "Perfect Security",
      description: "Achieve a perfect score (100%)",
      icon: "🏆",
      unlocked: false,
    },
    {
      id: "scan-10",
      name: "Scanner Novice",
      description: "Complete 10 scans",
      icon: "⭐",
      unlocked: false,
    },
    {
      id: "scan-50",
      name: "Scanner Expert",
      description: "Complete 50 scans",
      icon: "💎",
      unlocked: false,
    },
    {
      id: "scan-100",
      name: "Scanner Master",
      description: "Complete 100 scans",
      icon: "👑",
      unlocked: false,
    },
    {
      id: "streak-7",
      name: "Weekly Warrior",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      unlocked: false,
    },
    {
      id: "fix-vulns",
      name: "Security Guardian",
      description: "Find and fix vulnerabilities",
      icon: "🛡️",
      unlocked: false,
    },
  ],
  scanHistory: [],
};

export function useStats() {
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("solguard-stats");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setStats({ ...INITIAL_STATS, ...parsed });
        } catch {
          // Invalid stored data, use initial
        }
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      localStorage.setItem("solguard-stats", JSON.stringify(stats));
    }
  }, [stats, mounted]);

  const calculateScore = (vulnerabilityCount: number): number => {
    // Base score calculation: 100 - (vulnerabilities * 20), minimum 0
    // Adjust this formula as needed
    return Math.max(0, Math.min(100, 100 - vulnerabilityCount * 20));
  };

  const recordScan = (
    vulnerabilityCount: number,
    status: "safe" | "unsafe"
  ) => {
    const score = calculateScore(vulnerabilityCount);
    const newStats: Stats = { ...stats };

    // Update basic stats
    newStats.totalScans += 1;
    newStats.totalVulnerabilities += vulnerabilityCount;
    newStats.averageScore =
      (newStats.averageScore * (newStats.totalScans - 1) + score) /
      newStats.totalScans;
    newStats.bestScore = Math.max(newStats.bestScore, score);

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    if (newStats.lastScanDate) {
      const lastScan = new Date(newStats.lastScanDate);
      lastScan.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor(
        (todayTimestamp - lastScan.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 0) {
        // Same day, don't change streak
      } else if (daysDiff === 1) {
        // Consecutive day
        newStats.currentStreak += 1;
      } else {
        // Streak broken
        newStats.currentStreak = 1;
      }
    } else {
      // First scan
      newStats.currentStreak = 1;
    }

    newStats.lastScanDate = todayTimestamp;

    // Add to history (keep last 50)
    const newScan: ScanHistory = {
      id: `scan-${Date.now()}`,
      timestamp: Date.now(),
      score,
      status,
      vulnerabilityCount,
    };

    newStats.scanHistory = [newScan, ...newStats.scanHistory].slice(0, 50);

    // Check achievements
    const newAchievements = [...newStats.achievements];

    // First scan
    if (!newAchievements.find((a) => a.id === "first-scan")?.unlocked) {
      const firstScan = newAchievements.find((a) => a.id === "first-scan");
      if (firstScan) {
        firstScan.unlocked = true;
        firstScan.unlockedAt = Date.now();
      }
    }

    // Perfect score
    if (
      score === 100 &&
      !newAchievements.find((a) => a.id === "perfect-score")?.unlocked
    ) {
      const perfect = newAchievements.find((a) => a.id === "perfect-score");
      if (perfect) {
        perfect.unlocked = true;
        perfect.unlockedAt = Date.now();
      }
    }

    // Scan milestones
    if (newStats.totalScans === 10) {
      const milestone = newAchievements.find((a) => a.id === "scan-10");
      if (milestone && !milestone.unlocked) {
        milestone.unlocked = true;
        milestone.unlockedAt = Date.now();
      }
    }

    if (newStats.totalScans === 50) {
      const milestone = newAchievements.find((a) => a.id === "scan-50");
      if (milestone && !milestone.unlocked) {
        milestone.unlocked = true;
        milestone.unlockedAt = Date.now();
      }
    }

    if (newStats.totalScans === 100) {
      const milestone = newAchievements.find((a) => a.id === "scan-100");
      if (milestone && !milestone.unlocked) {
        milestone.unlocked = true;
        milestone.unlockedAt = Date.now();
      }
    }

    // Streak achievement
    if (
      newStats.currentStreak >= 7 &&
      !newAchievements.find((a) => a.id === "streak-7")?.unlocked
    ) {
      const streak = newAchievements.find((a) => a.id === "streak-7");
      if (streak) {
        streak.unlocked = true;
        streak.unlockedAt = Date.now();
      }
    }

    // Found vulnerabilities
    if (
      vulnerabilityCount > 0 &&
      !newAchievements.find((a) => a.id === "fix-vulns")?.unlocked
    ) {
      const fixVulns = newAchievements.find((a) => a.id === "fix-vulns");
      if (fixVulns) {
        fixVulns.unlocked = true;
        fixVulns.unlockedAt = Date.now();
      }
    }

    newStats.achievements = newAchievements;
    setStats(newStats);

    // Return newly unlocked achievements
    return newAchievements.filter(
      (a) => a.unlocked && a.unlockedAt === Date.now()
    );
  };

  const getGrade = (score: number): string => {
    if (score >= 97) return "A+";
    if (score >= 93) return "A";
    if (score >= 90) return "A-";
    if (score >= 87) return "B+";
    if (score >= 83) return "B";
    if (score >= 80) return "B-";
    if (score >= 77) return "C+";
    if (score >= 73) return "C";
    if (score >= 70) return "C-";
    if (score >= 67) return "D+";
    if (score >= 63) return "D";
    if (score >= 60) return "D-";
    return "F";
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "emerald";
    if (score >= 60) return "yellow";
    if (score >= 40) return "orange";
    return "red";
  };

  return {
    stats,
    recordScan,
    calculateScore,
    getGrade,
    getScoreColor,
    mounted,
  };
}

