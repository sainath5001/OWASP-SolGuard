import { NextResponse } from "next/server";
import { analyzeSolidity } from "../../../lib/analysis/analyzer";
import { enrichFindingsWithGuidelines } from "../../../lib/analysis/owasp";
import type { EnrichedVulnerabilityFinding } from "../../../lib/analysis/types";

type ScanRequestBody = {
    source?: string;
};

// Next.js has a default body size limit, but you can configure it in next.config.mjs
// For now, we'll note that the original limit was 1MB
export async function POST(request: Request) {
    let body: ScanRequestBody;

    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json(
            {
                message: "Invalid JSON in request body."
            },
            { status: 400 }
        );
    }

    const { source } = body ?? {};

    if (!source || typeof source !== "string" || source.trim().length === 0) {
        return NextResponse.json(
            {
                message: "Solidity source code is required."
            },
            { status: 400 }
        );
    }

    try {
        // Step 1: Parse and analyze Solidity code
        const analysisFindings = analyzeSolidity(source);
        
        // Step 2: Enrich findings with OWASP guidelines (with timeout protection)
        let enrichedFindings: EnrichedVulnerabilityFinding[];
        try {
            // Set a timeout for OWASP API calls (10 seconds)
            enrichedFindings = await Promise.race([
                enrichFindingsWithGuidelines(analysisFindings),
                new Promise<EnrichedVulnerabilityFinding[]>((_, reject) => 
                    setTimeout(() => reject(new Error("OWASP API timeout")), 10000)
                )
            ]);
        } catch (guidelineError) {
            console.error("Guideline enrichment error:", guidelineError);
            // Fallback: use findings without OWASP guidelines
            enrichedFindings = analysisFindings.map((finding) => ({
                ...finding,
                owaspGuideline: "OWASP guidance temporarily unavailable. Please review OWASP Smart Contract Security guidelines."
            }));
        }

        const status = enrichedFindings.length > 0 ? "unsafe" : "safe";

        return NextResponse.json({
            vulnerabilities: enrichedFindings.map((finding) => ({
                name: finding.name,
                line: finding.line,
                code_snippet: finding.codeSnippet,
                why: finding.why,
                owasp_guideline: finding.owaspGuideline
            })),
            status
        });
    } catch (error) {
        console.error("Unexpected error in scan route:", error);
        return NextResponse.json(
            {
                message: "Unable to analyze Solidity source file.",
                detail: (error as Error).message,
                stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined
            },
            { status: 500 }
        );
    }
}
