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
        return NextResponse.json(
            {
                message: "Unable to analyze Solidity source file.",
                detail: (error as Error).message
            },
            { status: 500 }
        );
    }
}

