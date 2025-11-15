import { NextRequest, NextResponse } from "next/server";
import { analyzeSolidity } from "@/lib/analyzer";
import { enrichFindingsWithGuidelines } from "@/lib/guidelines";

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

        const analysisFindings = analyzeSolidity(source);
        const enrichedFindings = await enrichFindingsWithGuidelines(analysisFindings);

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

