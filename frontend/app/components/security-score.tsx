"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

type SecurityScoreProps = {
  score: number;
  grade: string;
  color: string;
  animate?: boolean;
};

export function SecurityScore({
  score,
  grade,
  color,
  animate = true,
}: SecurityScoreProps) {
  const spring = useSpring(0, { stiffness: 50, damping: 30 });
  const displayScore = useTransform(spring, (latest) =>
    Math.round(latest)
  );

  useEffect(() => {
    if (animate) {
      spring.set(score);
    } else {
      spring.set(score);
    }
  }, [score, spring, animate]);

  const getScoreIcon = () => {
    if (score >= 80) return ShieldCheck;
    if (score >= 60) return Shield;
    if (score >= 40) return ShieldAlert;
    return ShieldX;
  };

  const Icon = getScoreIcon();

  const colorClasses = {
    emerald: {
      bg: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-emerald-500/20",
      icon: "text-emerald-500",
    },
    yellow: {
      bg: "bg-yellow-500",
      text: "text-yellow-600 dark:text-yellow-400",
      ring: "ring-yellow-500/20",
      icon: "text-yellow-500",
    },
    orange: {
      bg: "bg-orange-500",
      text: "text-orange-600 dark:text-orange-400",
      ring: "ring-orange-500/20",
      icon: "text-orange-500",
    },
    red: {
      bg: "bg-red-500",
      text: "text-red-600 dark:text-red-400",
      ring: "ring-red-500/20",
      icon: "text-red-500",
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald;

  // Calculate circumference for circular progress
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="relative">
        {/* Circular Progress */}
        <svg
          className="transform -rotate-90"
          width="140"
          height="140"
        >
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-slate-200 dark:text-slate-800"
          />
          {/* Progress circle */}
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            className={colors.text}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: score / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className={`text-4xl font-bold ${colors.text}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {animate ? (
              <motion.span>
                {displayScore}
              </motion.span>
            ) : (
              score
            )}
            <span className="text-2xl">%</span>
          </motion.div>
          <motion.div
            className={`text-lg font-semibold ${colors.text}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {grade}
          </motion.div>
        </div>
      </div>

      {/* Icon badge */}
      <motion.div
        className={`mt-4 p-3 rounded-full ${colors.bg} ${colors.ring} ring-4`}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
      >
        <Icon className={`h-6 w-6 text-white ${colors.icon}`} />
      </motion.div>
    </motion.div>
  );
}

