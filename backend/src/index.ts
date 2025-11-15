import "dotenv/config";
import cors from "cors";
import express, { Request, Response } from "express";
import { analyzeSolidity } from "./analyzer.js";
import { enrichFindingsWithGuidelines } from "./guidelines.js";
import type { EnrichedVulnerabilityFinding } from "./types.js";

type ScanRequestBody = {
    source?: string;
};

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request: Request, response: Response) => {
    response.json({ status: "ok" });
});

app.post("/scan", async (request: Request<unknown, unknown, ScanRequestBody>, response: Response) => {
    const { source } = request.body ?? {};

    if (!source || typeof source !== "string" || source.trim().length === 0) {
        response.status(400).json({
            message: "Solidity source code is required."
        });
        return;
    }

    try {
        const analysisFindings = analyzeSolidity(source);
        const enrichedFindings: EnrichedVulnerabilityFinding[] = await enrichFindingsWithGuidelines(
            analysisFindings
        );

        const status = enrichedFindings.length > 0 ? "unsafe" : "safe";

        response.json({
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
        response.status(500).json({
            message: "Unable to analyze Solidity source file.",
            detail: (error as Error).message
        });
    }
});

app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Smart Contract Security Validator backend listening on port ${port}`);
});

