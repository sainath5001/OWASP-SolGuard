"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Award, CheckCircle2 } from "lucide-react";
import type { Achievement } from "../hooks/useStats";

type AchievementBadgeProps = {
  achievement: Achievement;
  showAll?: boolean;
};

export function AchievementBadge({
  achievement,
  showAll = false,
}: AchievementBadgeProps) {
  if (!showAll && !achievement.unlocked) {
    return null;
  }

  return (
    <motion.div
      className={`relative flex items-center gap-3 rounded-xl border p-3 ${
        achievement.unlocked
          ? "border-emerald-500/50 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-950/20"
          : "border-slate-300 bg-slate-100/50 dark:border-slate-700 dark:bg-slate-800/30 opacity-50"
      }`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: achievement.unlocked ? 1 : 0.5, scale: 1 }}
      whileHover={achievement.unlocked ? { scale: 1.05 } : {}}
    >
      <div className="text-3xl">{achievement.icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4
            className={`font-semibold ${
              achievement.unlocked
                ? "text-slate-900 dark:text-white"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {achievement.name}
          </h4>
          {achievement.unlocked && (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {achievement.description}
        </p>
        {achievement.unlocked && achievement.unlockedAt && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Unlocked{" "}
            {new Date(achievement.unlockedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </motion.div>
  );
}

type AchievementPanelProps = {
  achievements: Achievement[];
  newlyUnlocked: Achievement[];
  onClose?: () => void;
};

export function AchievementPanel({
  achievements,
  newlyUnlocked,
  onClose,
}: AchievementPanelProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progress = (unlockedCount / totalCount) * 100;

  return (
    <motion.div
      className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Achievements
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
        <Award className="h-6 w-6 text-yellow-500" />
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Newly unlocked notification */}
      <AnimatePresence>
        {newlyUnlocked.length > 0 && (
          <motion.div
            className="mb-4 rounded-lg border border-emerald-500/50 bg-emerald-50 p-4 dark:bg-emerald-950/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">
              🎉 New Achievement Unlocked!
            </p>
            {newlyUnlocked.map((achievement) => (
              <p key={achievement.id} className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                {achievement.icon} {achievement.name}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievements grid */}
      <div className="grid gap-3">
        {achievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            showAll
          />
        ))}
      </div>
    </motion.div>
  );
}

