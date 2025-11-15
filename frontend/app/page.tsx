"use client";

import axios from "axios";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./components/theme-toggle";

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
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function Home() {
  const [solidityCode, setSolidityCode] = useState<string>("");
  const [results, setResults] = useState<ScanResponse | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleScan = async () => {
    if (!solidityCode.trim()) {
      setError("Add Solidity code before scanning.");
      return;
    }

    setIsScanning(true);
    setError(null);
    setResults(null);

    try {
      const response = await axios.post<ScanResponse>(`${API_BASE_URL}/scan`, {
        source: solidityCode
      });
      setResults(response.data);
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
        ease: "easeOut",
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
        ease: "easeOut",
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
    hover: {
      y: -4,
      scale: 1.02,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.main
      className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <ThemeToggle />
      
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
            onClick={handleScan}
            disabled={isScanning}
            className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-800"
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
              <motion.p
                className="text-sm text-slate-600 dark:text-slate-300"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                Running static analysis and fetching OWASP guidance...
              </motion.p>
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
              <motion.div
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/70"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <span className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Scan Status
                </span>
                <motion.span
                  className={`rounded-full px-4 py-1 text-sm font-semibold ${
                    results.status === "safe"
                      ? "bg-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-500/30 text-red-700 dark:text-red-200"
                  }`}
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                  }}
                >
                  {results.status === "safe" ? "✅ SAFE" : "❌ VULNERABLE"}
                </motion.span>
              </motion.div>

              {results.vulnerabilities.length === 0 ? (
                <motion.p
                  className="text-sm text-slate-600 dark:text-slate-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  No issues detected. Keep monitoring for new security advisories.
                </motion.p>
              ) : (
                <motion.div
                  className="grid gap-4"
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  {results.vulnerabilities.map((vulnerability, index) => (
                    <motion.article
                      key={`${vulnerability.name}-${index}`}
                      className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/60"
                      variants={cardVariants}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                    >
                      <header className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {vulnerability.name}
                        </h2>
                        {typeof vulnerability.line === "number" && (
                          <motion.span
                            className="rounded-full bg-slate-200 px-3 py-1 text-xs uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: index * 0.1 + 0.2,
                              type: "spring",
                              stiffness: 200,
                            }}
                          >
                            Line {vulnerability.line}
                          </motion.span>
                        )}
                      </header>
                      <motion.p
                        className="text-sm text-slate-600 dark:text-slate-300"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                      >
                        {vulnerability.why}
                      </motion.p>
                      {vulnerability.code_snippet && (
                        <motion.pre
                          className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-200"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + 0.4 }}
                        >
                          <code>{vulnerability.code_snippet}</code>
                        </motion.pre>
                      )}
                      {vulnerability.owasp_guideline && (
                        <motion.p
                          className="text-sm text-slate-600 dark:text-slate-300"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.5 }}
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            OWASP Recommendation:
                          </span>{" "}
                          {vulnerability.owasp_guideline}
                        </motion.p>
                      )}
                    </motion.article>
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

