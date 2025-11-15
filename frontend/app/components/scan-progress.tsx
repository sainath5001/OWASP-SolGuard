"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Code, Search, Shield, CheckCircle2 } from "lucide-react";

type ScanStage = "parsing" | "analyzing" | "checking" | "complete";

type ScanProgressProps = {
  isScanning: boolean;
};

export function ScanProgress({ isScanning }: ScanProgressProps) {
  const [currentStage, setCurrentStage] = useState<ScanStage>("parsing");

  useEffect(() => {
    if (!isScanning) {
      setCurrentStage("parsing");
      return;
    }

    const stages: ScanStage[] = ["parsing", "analyzing", "checking", "complete"];
    let stageIndex = 0;

    const interval = setInterval(() => {
      if (stageIndex < stages.length - 1) {
        stageIndex++;
        setCurrentStage(stages[stageIndex]);
      } else {
        clearInterval(interval);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isScanning]);

  const stages = [
    {
      id: "parsing" as ScanStage,
      label: "Parsing Code",
      icon: Code,
      description: "Analyzing Solidity syntax...",
    },
    {
      id: "analyzing" as ScanStage,
      label: "Static Analysis",
      icon: Search,
      description: "Scanning for vulnerabilities...",
    },
    {
      id: "checking" as ScanStage,
      label: "OWASP Check",
      icon: Shield,
      description: "Fetching security guidelines...",
    },
    {
      id: "complete" as ScanStage,
      label: "Complete",
      icon: CheckCircle2,
      description: "Analysis finished!",
    },
  ];

  return (
    <AnimatePresence>
      {isScanning && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {/* Progress stages */}
          <div className="flex items-center justify-between">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = stage.id === currentStage;
              const isCompleted =
                stages.findIndex((s) => s.id === currentStage) > index;

              return (
                <div key={stage.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={`relative rounded-full p-3 ${
                        isActive
                          ? "bg-sky-500 text-white ring-4 ring-sky-500/30"
                          : isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-400 dark:bg-slate-800"
                      }`}
                      animate={
                        isActive
                          ? {
                              scale: [1, 1.1, 1],
                            }
                          : {}
                      }
                      transition={
                        isActive
                          ? {
                              duration: 1,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }
                          : {}
                      }
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <p
                      className={`mt-2 text-xs font-medium ${
                        isActive
                          ? "text-sky-600 dark:text-sky-400"
                          : isCompleted
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400"
                      }`}
                    >
                      {stage.label}
                    </p>
                  </div>
                  {index < stages.length - 1 && (
                    <motion.div
                      className="mx-2 h-1 flex-1 rounded-full bg-slate-200 dark:bg-slate-800"
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: isCompleted || isActive ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className={`h-full rounded-full ${
                          isCompleted
                            ? "bg-emerald-500"
                            : isActive
                            ? "bg-sky-500"
                            : "bg-slate-200 dark:bg-slate-800"
                        }`}
                        initial={{ width: 0 }}
                        animate={{
                          width:
                            isCompleted || isActive ? "100%" : "0%",
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current stage description */}
          <motion.p
            key={currentStage}
            className="text-center text-sm text-slate-600 dark:text-slate-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {stages.find((s) => s.id === currentStage)?.description}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

