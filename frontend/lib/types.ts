export type VulnerabilityName =
    | "Reentrancy"
    | "Low-Level Call Usage"
    | "Missing Access Control"
    | "Unchecked Arithmetic"
    | "Parser Error";

export type VulnerabilityFinding = {
    name: VulnerabilityName;
    line?: number;
    codeSnippet?: string;
    why: string;
};

export type EnrichedVulnerabilityFinding = VulnerabilityFinding & {
    owaspGuideline?: string;
};

