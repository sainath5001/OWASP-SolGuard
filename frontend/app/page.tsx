"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./components/theme-toggle";
import { useStats } from "./hooks/useStats";
import { SecurityScore } from "./components/security-score";
import { StatsDashboard } from "./components/stats-dashboard";
import { AchievementPanel, AchievementBadge } from "./components/achievement-badge";
import { EnhancedVulnerabilityCard } from "./components/enhanced-vulnerability-card";
import { ScanProgress } from "./components/scan-progress";
import { Confetti } from "./components/confetti";
import { Trophy, X, FileCode } from "lucide-react";

type Vulnerability = {
  name: string;
  line?: number;
  code_snippet?: string;
  why: string;
  owasp_guideline?: string;
};

type ScanResponse = {
  vulnerabilities: Vulnerability[];
  status: "safe" | "unsafe";
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export default function Home() {
  const [solidityCode, setSolidityCode] = useState<string>("");
  const [results, setResults] = useState<ScanResponse | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState<boolean>(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);

  const { stats, recordScan, calculateScore, getGrade, getScoreColor, mounted } = useStats();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.name.endsWith(".sol")) {
      setError("Please upload a valid .sol Solidity file.");
      return;
    }

    try {
      const text = await file.text();
      setSolidityCode(text);
      setError(null);
    } catch (uploadError) {
      setError("Unable to read the uploaded file.");
    }
  };

  const loadExampleContract = () => {
    const exampleCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ExampleContract {
    address public owner;
    uint256 public balance;
    
    constructor() {
        owner = msg.sender;
    }
    
    function deposit() public payable {
        balance += msg.value;
    }
    
    function withdraw(uint256 amount) public {
        require(msg.sender == owner, "Not owner");
        require(amount <= balance, "Insufficient balance");
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balance -= amount;
    }
}`;
    setSolidityCode(exampleCode);
    setError(null);
  };

  const handleScan = async () => {
    if (!solidityCode.trim()) {
      setError("Add Solidity code before scanning.");
      return;
    }

    setIsScanning(true);
    setError(null);
    setResults(null);
    setShowConfetti(false);
    setNewlyUnlocked([]);

    try {
      const response = await axios.post<ScanResponse>(`${API_BASE_URL}/api/scan`, {
        source: solidityCode
      });
      setResults(response.data);

      // Record scan and get achievements
      if (mounted) {
        const unlocked = recordScan(
          response.data.vulnerabilities.length,
          response.data.status
        );

        if (unlocked.length > 0) {
          setNewlyUnlocked(unlocked);
          setShowAchievements(true);
        }

        // Show confetti for perfect score
        const score = calculateScore(response.data.vulnerabilities.length);
        if (score === 100) {
          setShowConfetti(true);
        }
      }
    } catch (scanError) {
      setError("Scan failed. Check the backend server and try again.");
    } finally {
      setIsScanning(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  // Calculate current score
  const currentScore = results
    ? calculateScore(results.vulnerabilities.length)
    : 0;
  const currentGrade = results ? getGrade(currentScore) : "";
  const currentColor = results ? getScoreColor(currentScore) : "emerald";

  // Show unlocked achievements count
  const unlockedAchievements = stats.achievements.filter((a) => a.unlocked);
  const hasNewAchievements = newlyUnlocked.length > 0;

  return (
    <motion.main
      className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Confetti active={showConfetti} />

      <ThemeToggle />

      {/* Stats Dashboard */}
      {mounted && stats.totalScans > 0 && (
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <StatsDashboard stats={stats} />
        </motion.div>
      )}

      {/* Achievement Badge Button */}
      {mounted && (
        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            onClick={() => setShowAchievements(true)}
            className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trophy className="h-4 w-4" />
            Achievements
            {unlockedAchievements.length > 0 && (
              <span className="ml-1 rounded-full bg-white/30 px-2 py-0.5 text-xs">
                {unlockedAchievements.length}
              </span>
            )}
            {hasNewAchievements && (
              <motion.span
                className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-red-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Achievement Panel Modal */}
      <AnimatePresence>
        {showAchievements && mounted && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAchievements(false)}
          >
            <motion.div
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-slate-900"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Achievements
                </h2>
                <button
                  onClick={() => setShowAchievements(false)}
                  className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <AchievementPanel
                  achievements={stats.achievements}
                  newlyUnlocked={newlyUnlocked}
                  onClose={() => setShowAchievements(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        className="space-y-3 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p
          className="text-sm font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400"
          variants={itemVariants}
        >
          Smart Contract Security Validator
        </motion.p>
        <motion.h1
          className="text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl"
          variants={itemVariants}
        >
          Analyze Solidity smart contracts with automated security checks
        </motion.h1>
        <motion.p
          className="text-base text-slate-600 dark:text-slate-300 sm:text-lg"
          variants={itemVariants}
        >
          Paste your contract or upload a .sol file to scan for common
          vulnerabilities and reference OWASP security guidance.
        </motion.p>
      </motion.header>

      <motion.section
        className="grid gap-6 rounded-2xl border border-slate-200 bg-slate-100/50 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900/50"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <motion.label
              className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 dark:border-slate-700 dark:bg-slate-800"
                animate={solidityCode ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                Upload .sol file
              </motion.span>
              <input
                type="file"
                accept=".sol"
                onChange={handleFileUpload}
                className="hidden"
              />
            </motion.label>

            <motion.button
              type="button"
              onClick={loadExampleContract}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileCode className="h-4 w-4" />
              Load Example
            </motion.button>
          </div>

          <motion.button
            type="button"
            onClick={handleScan}
            disabled={isScanning}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:to-sky-500 hover:shadow-xl disabled:cursor-not-allowed disabled:from-sky-800 disabled:to-sky-800"
            whileHover={!isScanning ? { scale: 1.05 } : {}}
            whileTap={!isScanning ? { scale: 0.95 } : {}}
            animate={
              isScanning
                ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "0 0 0px rgba(14, 165, 233, 0.4)",
                    "0 0 20px rgba(14, 165, 233, 0.6)",
                    "0 0 0px rgba(14, 165, 233, 0.4)",
                  ],
                }
                : {}
            }
            transition={
              isScanning
                ? {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
                : { duration: 0.2 }
            }
          >
            {isScanning ? (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                Scanning...
              </motion.span>
            ) : (
              "Scan"
            )}
          </motion.button>
        </div>

        <motion.textarea
          value={solidityCode}
          onChange={(event) => setSolidityCode(event.target.value)}
          placeholder="Paste Solidity code here..."
          className="h-64 w-full rounded-xl border border-slate-300 bg-white p-4 font-mono text-sm text-slate-900 shadow-inner outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200"
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        />

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              className="rounded-lg border border-red-500/50 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200"
              initial={{ opacity: 0, y: -10, x: [0, -10, 10, -10, 10, 0] }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                x: { duration: 0.5 },
                opacity: { duration: 0.3 },
                y: { duration: 0.3 },
              }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.section>

      <motion.section
        className="min-h-64 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900/40"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {isScanning && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <ScanProgress isScanning={isScanning} />
            </motion.div>
          )}

          {!isScanning && results && (
            <motion.div
              key="results"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Security Score and Status */}
              <div className="grid gap-6 md:grid-cols-2">
                <motion.div
                  className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950/70"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Security Score
                  </h3>
                  <SecurityScore
                    score={currentScore}
                    grade={currentGrade}
                    color={currentColor}
                    animate={true}
                  />
                </motion.div>

                <motion.div
                  className="flex flex-col justify-center space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950/70"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Scan Status
                    </span>
                    <motion.span
                      className={`rounded-full px-4 py-1 text-sm font-semibold ${results.status === "safe"
                          ? "bg-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                          : "bg-red-500/30 text-red-700 dark:text-red-200"
                        }`}
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.4,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      {results.status === "safe" ? "✅ SAFE" : "❌ VULNERABLE"}
                    </motion.span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        Vulnerabilities Found:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {results.vulnerabilities.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        Security Grade:
                      </span>
                      <span className={`font-semibold ${currentColor === "emerald" ? "text-emerald-600 dark:text-emerald-400" : currentColor === "yellow" ? "text-yellow-600 dark:text-yellow-400" : currentColor === "orange" ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"}`}>
                        {currentGrade}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {results.vulnerabilities.length === 0 ? (
                <motion.div
                  className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-6 text-center dark:bg-emerald-950/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div
                    className="mb-2 text-4xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  >
                    🎉
                  </motion.div>
                  <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                    Perfect Score! No vulnerabilities detected.
                  </p>
                  <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                    Keep monitoring for new security advisories.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Detected Vulnerabilities ({results.vulnerabilities.length})
                  </h3>
                  {results.vulnerabilities.map((vulnerability, index) => (
                    <EnhancedVulnerabilityCard
                      key={`${vulnerability.name}-${index}`}
                      vulnerability={vulnerability}
                      index={index}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {!isScanning && !results && (
            <motion.p
              key="empty"
              className="text-sm text-slate-500 dark:text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              Results will appear here after you run a scan.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.section>
    </motion.main>
  );
}
