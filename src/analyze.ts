import { parse, type Node } from "libpg-query";
import type { Config } from "./config.js";
import { ALL_RULES, type Rule, type RuleId, type Severity } from "./rules/index.js";

export interface Finding {
  ruleId: RuleId;
  severity: Severity;
  message: string;
  file: string;
  /** 1-based line of the offending statement within the analyzed SQL. */
  line: number;
}

/** Postgres reports statement positions as UTF-8 byte offsets; convert to a 1-based line. */
export function lineAtByteOffset(sql: string, byteOffset: number): number {
  const bytes = Buffer.from(sql, "utf8");
  let i = byteOffset;
  // stmt_location points just past the previous semicolon, so skip leading whitespace.
  while (i < bytes.length && (bytes[i] === 0x20 || bytes[i] === 0x0a || bytes[i] === 0x0d || bytes[i] === 0x09)) {
    i++;
  }
  return bytes.subarray(0, i).toString("utf8").split("\n").length;
}

/** The table a statement targets, when there is a single obvious one. */
export function targetTable(stmt: Node): string | undefined {
  const inner = Object.values(stmt)[0] as { relation?: { relname?: string } } | undefined;
  return inner?.relation?.relname;
}

function activeRules(config: Config): { rule: Rule; severity: Severity }[] {
  return ALL_RULES.flatMap((rule) => {
    const setting = config.rules[rule.id] ?? rule.defaultSeverity;
    return setting === "off" ? [] : [{ rule, severity: setting }];
  });
}

export async function analyzeSql(sql: string, file: string, config: Config): Promise<Finding[]> {
  const { stmts = [] } = await parse(sql);
  const rules = activeRules(config);
  const findings: Finding[] = [];

  for (const raw of stmts) {
    if (raw.stmt === undefined) continue;
    const table = targetTable(raw.stmt);
    if (table !== undefined && config.ignoreTables.includes(table)) continue;

    const line = lineAtByteOffset(sql, raw.stmt_location ?? 0);
    for (const { rule, severity } of rules) {
      for (const v of rule.check(raw.stmt)) {
        findings.push({ ruleId: rule.id, severity, message: v.message, file, line });
      }
    }
  }
  return findings;
}
