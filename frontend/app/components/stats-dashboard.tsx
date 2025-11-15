"use client";

import { motion } from "framer-motion";
import { ScanLine, Shield, TrendingUp, Flame, Award } from "lucide-react";
import type { Stats } from "../hooks/useStats";

type StatsDashboardProps = {
  stats: Stats;
};

export function StatsDashboard({ stats }: StatsDashboardProps) {
  const statItems = [
    {
      label: "Total Scans",
      value: stats.totalScans,
      icon: ScanLine,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
    },
    {
      label: "Vulnerabilities Found",
      value: stats.totalVulnerabilities,
      icon: Shield,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Average Score",
      value: `${Math.round(stats.averageScore)}%`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Best Score",
      value: `${Math.round(stats.bestScore)}%`,
      icon: Award,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      label: "Current Streak",
      value: `${stats.currentStreak} days`,
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {item.value}
                </p>
              </div>
              <div
                className={`rounded-lg p-3 ${item.bgColor} ${item.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

