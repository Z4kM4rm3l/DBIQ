import type { Finding } from "./analyze.js";

export type OutputFormat = "text" | "github";

export function formatText(findings: readonly Finding[]): string {
  if (findings.length === 0) return "No dangerous operations found.";
  const lines = findings.map(
    (f) => `${f.file}:${f.line}  ${f.severity.toUpperCase().padEnd(7)} ${f.ruleId}  ${f.message}`,
  );
  const errors = findings.filter((f) => f.severity === "error").length;
  lines.push("", `${findings.length} finding(s), ${errors} error(s).`);
  return lines.join("\n");
}

/** GitHub Actions workflow-command escaping for annotation messages and properties. */
function escapeData(s: string): string {
  return s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
function escapeProperty(s: string): string {
  return escapeData(s).replace(/:/g, "%3A").replace(/,/g, "%2C");
}

/**
 * Prints `::error file=...,line=...::message` lines. When run inside a GitHub
 * Action, these show up as annotations on the PR's changed files, using only
 * the built-in token. No PR Review API or diff-position math needed.
 */
export function formatGithub(findings: readonly Finding[]): string {
  return findings
    .map(
      (f) =>
        `::${f.severity} file=${escapeProperty(f.file)},line=${f.line},title=${escapeProperty(
          `DBIQ: ${f.ruleId}`,
        )}::${escapeData(f.message)}`,
    )
    .join("\n");
}

export function format(findings: readonly Finding[], fmt: OutputFormat): string {
  return fmt === "github" ? formatGithub(findings) : formatText(findings);
}
