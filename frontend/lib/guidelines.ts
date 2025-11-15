import { Nest } from "owasp-nest";
import type { ProjectDetail } from "owasp-nest/models";
import type { VulnerabilityFinding, VulnerabilityName } from "./types";
import type { EnrichedVulnerabilityFinding } from "./types";

const DEFAULT_SERVER_URL = "https://nest.owasp.dev";

const KEYWORD_MAP: Record<VulnerabilityName, string[]> = {
    Reentrancy: ["reentrancy", "smart contract", "blockchain", "re-entrancy"],
    "Low-Level Call Usage": ["low level call", "solidity", "call()", "delegatecall"],
    "Missing Access Control": ["access control", "authorization", "least privilege"],
    "Unchecked Arithmetic": ["integer overflow", "safemath", "arithmetic", "overflow"],
    "Parser Error": ["smart contract", "secure coding", "linting"]
};

const FALLBACK_GUIDELINES: Record<VulnerabilityName, string> = {
    Reentrancy:
        "Review OWASP Smart Contract Reentrancy guidance: prioritize state updates before external calls and implement reentrancy guards.",
    "Low-Level Call Usage":
        "OWASP recommends wrapping low-level calls with strict success checks and prefer high-level interfaces over `.call()`.",
    "Missing Access Control":
        "Enforce least privilege per OWASP access control guidelines. Ensure all state-changing functions validate authorized callers.",
    "Unchecked Arithmetic":
        "Apply OWASP integer overflow mitigations: use Solidity >=0.8.0 or SafeMath libraries for arithmetic operations.",
    "Parser Error":
        "OWASP secure coding practices recommend validating compiler compatibility and linting contracts before analysis."
};

const projectDetailCache = new Map<string, ProjectDetail>();

export async function enrichFindingsWithGuidelines(
    findings: VulnerabilityFinding[]
): Promise<EnrichedVulnerabilityFinding[]> {
    if (findings.length === 0) {
        return [];
    }

    const apiKey = process.env.NEST_API_KEY;
    const serverURL = process.env.NEST_API_BASE_URL ?? DEFAULT_SERVER_URL;

    if (!apiKey) {
        return findings.map((finding) => ({
            ...finding,
            owaspGuideline: FALLBACK_GUIDELINES[finding.name]
        }));
    }

    let projects: Awaited<ReturnType<Nest["projects"]["listProjects"]>> | null = null;
    const nest = new Nest({
        apiKey,
        serverURL
    });

    try {
        // Set a timeout for the API call (8 seconds)
        projects = await Promise.race([
            nest.projects.listProjects({ pageSize: 200 }),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error("API request timeout after 8 seconds")), 8000)
            )
        ]);
    } catch (error) {
        // Return findings with fallback guidelines if API fails
        return findings.map((finding) => ({
            ...finding,
            owaspGuideline: FALLBACK_GUIDELINES[finding.name]
        }));
    }

    const detailCache = new Map<VulnerabilityName, string>();

    // Process findings with individual error handling to prevent one failure from breaking all
    return Promise.all(
        findings.map(async (finding) => {
            if (detailCache.has(finding.name)) {
                return {
                    ...finding,
                    owaspGuideline: detailCache.get(finding.name)
                };
            }

            let guideline: string;
            try {
                guideline = (await Promise.race([
                    resolveGuidelineFromProjects(nest, projects, finding.name),
                    new Promise<string | undefined>((resolve) => 
                        setTimeout(() => resolve(undefined), 5000)
                    )
                ])) ?? FALLBACK_GUIDELINES[finding.name];
            } catch (error) {
                // If individual guideline lookup fails, use fallback
                guideline = FALLBACK_GUIDELINES[finding.name];
            }

            detailCache.set(finding.name, guideline);

            return {
                ...finding,
                owaspGuideline: guideline
            };
        })
    );
}

async function resolveGuidelineFromProjects(
    nest: Nest,
    projects: Awaited<ReturnType<Nest["projects"]["listProjects"]>>,
    vulnerabilityName: VulnerabilityName
): Promise<string | undefined> {
    const keywords = KEYWORD_MAP[vulnerabilityName];

    for (const project of projects.items) {
        const detail = await fetchProjectDetail(nest, project.key);
        const haystack = `${detail.name} ${detail.description}`.toLowerCase();

        if (keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
            return trimDescription(detail.description);
        }
    }

    return undefined;
}

async function fetchProjectDetail(nest: Nest, key: string): Promise<ProjectDetail> {
    if (projectDetailCache.has(key)) {
        return projectDetailCache.get(key)!;
    }

    try {
        // Set timeout for individual project detail fetch (3 seconds)
        const detail = await Promise.race([
            nest.projects.getProject({ projectId: key }),
            new Promise<ProjectDetail>((_, reject) => 
                setTimeout(() => reject(new Error("Project detail fetch timeout")), 3000)
            )
        ]);
        projectDetailCache.set(key, detail);
        return detail;
    } catch (error) {
        // Return a minimal project detail if fetch fails
        return {
            key,
            name: "",
            description: "",
            // Add other required fields with defaults
        } as ProjectDetail;
    }
}

function trimDescription(description: string, maxLength = 320): string {
    if (description.length <= maxLength) {
        return description.trim();
    }

    return `${description.slice(0, maxLength - 1).trimEnd()}…`;
}

