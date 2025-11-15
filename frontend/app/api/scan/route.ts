<<<<<<< HEAD
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
        const analysisFindings = analyzeSolidity(source);
        const enrichedFindings: EnrichedVulnerabilityFinding[] = await enrichFindingsWithGuidelines(
            analysisFindings
        );
=======
import { NextRequest, NextResponse } from "next/server";
import { analyzeSolidity } from "@/lib/analyzer";
import { enrichFindingsWithGuidelines } from "@/lib/guidelines";
import type { EnrichedVulnerabilityFinding } from "@/lib/types";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { source } = body;

        if (!source || typeof source !== "string" || source.trim().length === 0) {
            return NextResponse.json(
                { message: "Solidity source code is required." },
                { status: 400 }
            );
        }

        // Step 1: Parse and analyze Solidity code
        let analysisFindings;
        try {
            analysisFindings = analyzeSolidity(source);
        } catch (parseError) {
            console.error("Parser error:", parseError);
            return NextResponse.json(
                {
                    message: "Failed to parse Solidity code.",
                    detail: (parseError as Error).message,
                    vulnerabilities: [{
                        name: "Parser Error",
                        why: `Parsing error: ${(parseError as Error).message}`,
                        owasp_guideline: "OWASP secure coding practices recommend validating compiler compatibility and linting contracts before analysis."
                    }],
                    status: "unsafe"
                },
                { status: 200 }
            );
        }

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
>>>>>>> feb694d848f782c054d4ec628119b44ce6a3734a

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
<<<<<<< HEAD
        return NextResponse.json(
            {
                message: "Unable to analyze Solidity source file.",
                detail: (error as Error).message
=======
        console.error("Unexpected error in scan route:", error);
        return NextResponse.json(
            {
                message: "Unable to analyze Solidity source file.",
                detail: (error as Error).message,
                stack: process.env.NODE_ENV === "development" ? (error as Error).stack : undefined
>>>>>>> feb694d848f782c054d4ec628119b44ce6a3734a
            },
            { status: 500 }
        );
    }
}

