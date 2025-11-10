"use client";

import axios from "axios";
import { useState } from "react";

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

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-sky-400">
          Smart Contract Security Validator
        </p>
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          Analyze Solidity smart contracts with automated security checks
        </h1>
        <p className="text-base text-slate-300 sm:text-lg">
          Paste your contract or upload a .sol file to scan for common
          vulnerabilities and reference OWASP security guidance.
        </p>
      </header>

      <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-200">
            <span className="inline-flex h-10 items-center rounded-full border border-slate-700 bg-slate-800 px-4">
              Upload .sol file
            </span>
            <input
              type="file"
              accept=".sol"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleScan}
            disabled={isScanning}
            className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-800"
          >
            {isScanning ? "Scanning..." : "Scan"}
          </button>
        </div>

        <textarea
          value={solidityCode}
          onChange={(event) => setSolidityCode(event.target.value)}
          placeholder="Paste Solidity code here..."
          className="h-64 w-full rounded-xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-sm text-slate-200 shadow-inner outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/40"
        />

        {error ? (
          <p className="rounded-lg border border-red-500/50 bg-red-900/20 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}
      </section>

      <section className="min-h-64 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg">
        {isScanning && (
          <p className="text-sm text-slate-300">
            Running static analysis and fetching OWASP guidance...
          </p>
        )}

        {!isScanning && results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Scan Status
              </span>
              <span
                className={`rounded-full px-4 py-1 text-sm font-semibold ${
                  results.status === "safe"
                    ? "bg-emerald-500/30 text-emerald-300"
                    : "bg-red-500/30 text-red-200"
                }`}
              >
                {results.status === "safe" ? "✅ SAFE" : "❌ VULNERABLE"}
              </span>
            </div>

            {results.vulnerabilities.length === 0 ? (
              <p className="text-sm text-slate-300">
                No issues detected. Keep monitoring for new security advisories.
              </p>
            ) : (
              <div className="grid gap-4">
                {results.vulnerabilities.map((vulnerability, index) => (
                  <article
                    key={`${vulnerability.name}-${index}`}
                    className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-5"
                  >
                    <header className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold text-white">
                        {vulnerability.name}
                      </h2>
                      {typeof vulnerability.line === "number" && (
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
                          Line {vulnerability.line}
                        </span>
                      )}
                    </header>
                    <p className="text-sm text-slate-300">{vulnerability.why}</p>
                    {vulnerability.code_snippet ? (
                      <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/90 p-3 text-xs text-slate-200">
                        <code>{vulnerability.code_snippet}</code>
                      </pre>
                    ) : null}
                    {vulnerability.owasp_guideline ? (
                      <p className="text-sm text-slate-300">
                        <span className="font-semibold text-slate-200">
                          OWASP Recommendation:
                        </span>{" "}
                        {vulnerability.owasp_guideline}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {!isScanning && !results && (
          <p className="text-sm text-slate-400">
            Results will appear here after you run a scan.
          </p>
        )}
      </section>
    </main>
  );
}

