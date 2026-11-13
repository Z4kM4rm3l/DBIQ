import type { Node } from "libpg-query";

export const RULE_IDS = [
  "drop-column",
  "drop-table",
  "create-index-non-concurrent",
  "set-not-null",
  "alter-column-type",
  "constraint-not-valid",
  "rename",
] as const;

export type RuleId = (typeof RULE_IDS)[number];
export type Severity = "error" | "warning";

/** One problem a rule found in one statement. */
export interface RuleViolation {
  message: string;
}

/**
 * A rule receives a single parsed SQL statement (a node from Postgres's own
 * parser) and returns zero or more violations. Rules are pure functions:
 * no I/O, no shared state, which keeps them trivial to unit test.
 */
export interface Rule {
  id: RuleId;
  description: string;
  defaultSeverity: Severity;
  check(stmt: Node): RuleViolation[];
}
