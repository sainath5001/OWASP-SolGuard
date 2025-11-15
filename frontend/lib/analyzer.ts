import parser, {
    ASTNode,
    BinaryOperation,
    ExpressionStatement,
    FunctionDefinition,
    Location,
    MemberAccess,
    StateVariableDeclaration,
    Visitor
} from "solidity-parser-antlr";
import { VulnerabilityFinding, VulnerabilityName } from "./types";

type AnalysisContext = {
    sourceLines: string[];
    stateVariables: Set<string>;
    pragmaVersion?: string;
};

type FunctionFindingContext = {
    functionNode: FunctionDefinition;
    stateAssignments: Array<{ line: number; loc?: Location }>;
    externalCalls: Array<{ line: number; node: MemberAccess }>;
    unsafeArithmetic: BinaryOperation[];
};

type AssignmentExpression = {
    type: "Assignment";
    left: { type: string; name?: string; expression?: { type: string; name?: string } };
    loc?: Location;
};

// Low-level calls are direct address.call(), address.delegatecall(), etc.
// IERC20.transfer() and IERC20.transferFrom() are high-level interface methods and should not be flagged
// Only flag: call, delegatecall, callcode, staticcall, send
// Do NOT flag: transfer, transferFrom (these are IERC20 interface methods)
const LOW_LEVEL_CALLS = new Set(["call", "delegatecall", "callcode", "staticcall", "send"]);
const ACCESS_CONTROL_MODIFIERS = new Set(["onlyOwner", "onlyRole", "adminOnly", "authorized"]);
const ARITHMETIC_OPERATORS = new Set(["+", "-", "*", "/"]);

export function analyzeSolidity(source: string): VulnerabilityFinding[] {
    const context: AnalysisContext = {
        sourceLines: source.split(/\r?\n/),
        stateVariables: new Set<string>()
    };

    let ast: ASTNode;

    try {
        ast = parser.parse(source, { tolerant: true, loc: true, range: true });
    } catch (error) {
        return [
            {
                name: "Parser Error",
                line: undefined,
                codeSnippet: undefined,
                why: `Parsing error: ${(error as Error).message}`
            }
        ];
    }

    const findings: VulnerabilityFinding[] = [];

    parser.visit(ast, {
        PragmaDirective: (node) => {
            if (node.name === "solidity" && typeof node.value === "string") {
                context.pragmaVersion = node.value;
            }
        },
        StateVariableDeclaration: (node) => {
            node.variables.forEach((variable) => {
                if (variable.name) {
                    context.stateVariables.add(variable.name);
                }
            });
        },
        FunctionDefinition: (node) => {
            const fnContext: FunctionFindingContext = {
                functionNode: node,
                stateAssignments: [],
                externalCalls: [],
                unsafeArithmetic: []
            };

            if (node.body) {
                parser.visit(
                    node.body,
                    {
                        ExpressionStatement: (exprNode: ExpressionStatement) => {
                            const expression = exprNode.expression as unknown;
                            if (isAssignmentExpression(expression) && isStateAssignment(expression, context.stateVariables)) {
                                fnContext.stateAssignments.push({
                                    line: expression.loc?.start.line ?? exprNode.loc?.start.line ?? node.loc?.start.line ?? 0,
                                    loc: expression.loc ?? exprNode.loc
                                });
                            }
                        },
                        MemberAccess: (memberAccessNode: MemberAccess) => {
                            // Only flag low-level calls, not IERC20 interface methods
                            // Check if it's a direct address member access (low-level) vs interface method
                            if (LOW_LEVEL_CALLS.has(memberAccessNode.memberName)) {
                                const expr = memberAccessNode.expression;
                                if (expr && "type" in expr) {
                                    // Check if it's a type conversion like address(msg.sender).call()
                                    // FunctionCall expressions like address(...) should be flagged
                                    if (expr.type === "FunctionCall") {
                                        // This is likely address(...).call() - flag it as low-level
                                        fnContext.externalCalls.push({
                                            line: memberAccessNode.loc?.start.line ?? 0,
                                            node: memberAccessNode
                                        });
                                    } else if (expr.type === "Identifier" && "name" in expr) {
                                        const varName = expr.name;
                                        // If it's a state variable, it's likely an interface (IERC20), skip
                                        // If it's not in stateVariables, it might be a raw address, flag it
                                        if (!context.stateVariables.has(varName)) {
                                            // Could be address.call() or similar - flag as low-level
                                            fnContext.externalCalls.push({
                                                line: memberAccessNode.loc?.start.line ?? 0,
                                                node: memberAccessNode
                                            });
                                        }
                                        // If it IS a state variable (like s_stakingToken), it's IERC20 - skip
                                    } else {
                                        // Other expression types - flag as potentially low-level
                                        fnContext.externalCalls.push({
                                            line: memberAccessNode.loc?.start.line ?? 0,
                                            node: memberAccessNode
                                        });
                                    }
                                } else {
                                    // No expression or unknown type - flag it
                                    fnContext.externalCalls.push({
                                        line: memberAccessNode.loc?.start.line ?? 0,
                                        node: memberAccessNode
                                    });
                                }
                            }
                        },
                        BinaryOperation: (binaryOperationNode: BinaryOperation) => {
                            if (ARITHMETIC_OPERATORS.has(binaryOperationNode.operator)) {
                                fnContext.unsafeArithmetic.push(binaryOperationNode);
                            }
                        }
                    } as unknown as Visitor
                );
            }

            const accessControlFindings = detectAccessControlIssues(node, context);
            const lowLevelCallFindings = detectLowLevelCallIssues(fnContext, context);
            const reentrancyFindings = detectReentrancyIssues(fnContext, context);
            const arithmeticFindings = detectArithmeticIssues(fnContext, context);
            
            findings.push(...accessControlFindings);
            findings.push(...lowLevelCallFindings);
            findings.push(...reentrancyFindings);
            findings.push(...arithmeticFindings);
        }
    });

    const merged = mergeDuplicateFindings(findings);
    // Debug: log findings in development
    if (process.env.NODE_ENV === "development" && merged.length > 0) {
        console.log(`[Analyzer] Found ${merged.length} vulnerabilities`);
    }
    return merged;
}

function detectAccessControlIssues(
    functionNode: FunctionDefinition,
    context: AnalysisContext
): VulnerabilityFinding[] {
    if (!functionNode.name || !functionNode.loc) {
        return [];
    }

    if (functionNode.isConstructor || (functionNode as unknown as { kind?: string }).kind === "constructor") {
        return [];
    }

    // Skip view and pure functions - they don't modify state and don't need access control
    const stateMutability = functionNode.stateMutability;
    // Also check if function has "view" or "pure" keyword in modifiers or other properties
    const isViewOrPure = stateMutability === "view" || 
                        stateMutability === "pure" || 
                        stateMutability === "constant" ||
                        (functionNode as unknown as { isView?: boolean }).isView === true ||
                        (functionNode as unknown as { isPure?: boolean }).isPure === true;
    
    if (isViewOrPure) {
        return [];
    }

    const isPublicFacing =
        functionNode.visibility === "public" ||
        functionNode.visibility === "external" ||
        functionNode.visibility === "default";

    if (!isPublicFacing) {
        return [];
    }

    const hasAccessControl = (functionNode.modifiers ?? []).some((modifier) => {
        const modifierName = modifier.name;
        return modifierName ? ACCESS_CONTROL_MODIFIERS.has(modifierName) : false;
    });

    if (hasAccessControl) {
        return [];
    }

    // Check if function modifies state - if it doesn't have a body or only reads, skip
    // This is a heuristic: functions that modify state typically need access control
    // User-facing functions (like stake, withdrawStakedTokens, getReward) are intentionally public
    // Only flag if function name suggests admin/owner operations (not user interactions)
    const functionName = functionNode.name.toLowerCase();
    const adminKeywords = ["set", "update", "change", "modify", "delete", "remove", "pause", "unpause", "emergency", "admin", "owner"];
    const userInteractionKeywords = ["stake", "withdraw", "claim", "deposit", "reward", "earn", "mint", "burn", "transfer"];
    const isLikelyAdminFunction = adminKeywords.some(keyword => functionName.includes(keyword));
    const isUserInteraction = userInteractionKeywords.some(keyword => functionName.includes(keyword));

    // Skip user-facing functions - they should be public (but note: some might still need access control)
    // For now, we'll be conservative and only flag obvious admin functions
    if (isUserInteraction && !isLikelyAdminFunction) {
        return [];
    }

    // Only flag functions that look like admin functions
    if (!isLikelyAdminFunction) {
        return [];
    }

    return [
        formatFinding("Missing Access Control", functionNode.loc, context, {
            why: "Public or external function that may modify critical state lacks `onlyOwner`/`onlyRole` style access control checks."
        })
    ];
}

function detectLowLevelCallIssues(
    fnContext: FunctionFindingContext,
    context: AnalysisContext
): VulnerabilityFinding[] {
    return fnContext.externalCalls.map((call) =>
        formatFinding("Low-Level Call Usage", call.node.loc, context, {
            why: "Low-level calls (`call`, `delegatecall`, `send`) bypass Solidity safety checks and require manual handling."
        })
    );
}

function detectReentrancyIssues(
    fnContext: FunctionFindingContext,
    context: AnalysisContext
): VulnerabilityFinding[] {
    const findings: VulnerabilityFinding[] = [];

    for (const externalCall of fnContext.externalCalls) {
        const laterAssignment = fnContext.stateAssignments.find(
            (assignment) => assignment.line > externalCall.line
        );

        if (laterAssignment) {
            findings.push(
                formatFinding("Reentrancy", laterAssignment.loc ?? externalCall.node.loc, context, {
                    why: "State changes after external calls may be re-entered by malicious contracts."
                })
            );
        }
    }

    return findings;
}

function detectArithmeticIssues(
    fnContext: FunctionFindingContext,
    context: AnalysisContext
): VulnerabilityFinding[] {
    if (!requiresSafeMath(context.pragmaVersion) || fnContext.unsafeArithmetic.length === 0) {
        return [];
    }

    const usingSafeMath = context.sourceLines.some((line) =>
        /using\s+SafeMath/.test(line)
    );

    if (usingSafeMath) {
        return [];
    }

    return fnContext.unsafeArithmetic.map((node) =>
        formatFinding("Unchecked Arithmetic", node.loc, context, {
            why: "Arithmetic operations in Solidity <0.8 can overflow without SafeMath or explicit checks."
        })
    );
}

function isStateAssignment(node: AssignmentExpression, stateVariables: Set<string>): boolean {
    if (node.left.type === "Identifier") {
        return stateVariables.has(node.left.name ?? "");
    }

    if (node.left.type === "MemberAccess" && node.left.expression && "name" in node.left.expression) {
        return stateVariables.has((node.left.expression as { name?: string }).name ?? "");
    }

    return false;
}

function isAssignmentExpression(expression: unknown): expression is AssignmentExpression {
    if (!expression || typeof expression !== "object") {
        return false;
    }

    return (expression as { type?: string }).type === "Assignment";
}

function requiresSafeMath(pragmaVersion?: string): boolean {
    if (!pragmaVersion) {
        return true;
    }

    const versionMatch = pragmaVersion.match(/(\d+)\.(\d+)\.(\d+)/);
    if (!versionMatch) {
        return true;
    }

    const [, majorStr, minorStr, patchStr] = versionMatch;
    const major = Number(majorStr);
    const minor = Number(minorStr);
    const patch = Number(patchStr);
    if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) {
        return true;
    }

    return major < 0 || (major === 0 && minor < 8);
}

function formatFinding(
    name: VulnerabilityName,
    loc: Location | undefined,
    context: AnalysisContext,
    detail: { why: string }
): VulnerabilityFinding {
    const line = loc?.start.line;
    return {
        name,
        line,
        codeSnippet: line ? extractSnippet(context.sourceLines, line) : undefined,
        why: detail.why
    };
}

function extractSnippet(sourceLines: string[], line: number, contextRadius = 1): string {
    const start = Math.max(line - 1 - contextRadius, 0);
    const end = Math.min(line - 1 + contextRadius, sourceLines.length - 1);
    return sourceLines.slice(start, end + 1).join("\n");
}

function mergeDuplicateFindings(findings: VulnerabilityFinding[]): VulnerabilityFinding[] {
    const seen = new Map<string, VulnerabilityFinding>();

    for (const finding of findings) {
        const key = `${finding.name}:${finding.line ?? "unknown"}:${finding.codeSnippet ?? ""}`;
        if (!seen.has(key)) {
            seen.set(key, finding);
        }
    }

    return Array.from(seen.values());
}

