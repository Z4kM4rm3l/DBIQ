import type { Rule, RuleViolation } from "./types.js";

/**
 * Reference implementation. The other rules follow this same shape:
 * narrow to the statement type you care about, then inspect its fields.
 */
export const dropColumn: Rule = {
  id: "drop-column",
  description: "Dropping a column breaks any running code that still reads or writes it.",
  defaultSeverity: "error",
  check(stmt) {
    if (!("AlterTableStmt" in stmt)) return [];
    const { relation, cmds = [] } = stmt.AlterTableStmt;
    const table = relation?.relname ?? "<unknown>";

    const violations: RuleViolation[] = [];
    for (const cmd of cmds) {
      if (!("AlterTableCmd" in cmd)) continue;
      if (cmd.AlterTableCmd.subtype === "AT_DropColumn") {
        violations.push({
          message:
            `Dropping column "${cmd.AlterTableCmd.name ?? "?"}" on "${table}". ` +
            "Deploy code that stops using the column first, then drop it in a later migration.",
        });
      }
    }
    return violations;
  },
};
