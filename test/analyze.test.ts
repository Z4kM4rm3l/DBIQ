import { describe, expect, it } from "vitest";
import { analyzeSql, lineAtByteOffset } from "../src/analyze.js";
import { parseConfig } from "../src/config.js";

// Shape of `alembic upgrade <from>:head --sql` output.
const ALEMBIC_OUTPUT = `BEGIN;

-- Running upgrade 0003 -> 0004

ALTER TABLE clients DROP COLUMN legacy_key;

UPDATE alembic_version SET version_num='0004' WHERE alembic_version.version_num = '0003';

COMMIT;
`;

describe("analyzeSql", () => {
  it("reports findings with the correct line number", async () => {
    const findings = await analyzeSql(ALEMBIC_OUTPUT, "migrations/0004.py", parseConfig({}));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ ruleId: "drop-column", severity: "error", line: 5 });
  });

  it("skips Alembic's own alembic_version bookkeeping", async () => {
    const sql = "ALTER TABLE alembic_version DROP COLUMN version_num;";
    expect(await analyzeSql(sql, "x.sql", parseConfig({}))).toEqual([]);
  });

  it("respects severity overrides", async () => {
    const config = parseConfig({ rules: { "drop-column": "warning" } });
    const findings = await analyzeSql("ALTER TABLE t DROP COLUMN c;", "x.sql", config);
    expect(findings[0]?.severity).toBe("warning");
  });

  it("can turn a rule off", async () => {
    const config = parseConfig({ rules: { "drop-column": "off" } });
    expect(await analyzeSql("ALTER TABLE t DROP COLUMN c;", "x.sql", config)).toEqual([]);
  });

  it("throws on invalid SQL", async () => {
    await expect(analyzeSql("ALTER TABLE", "x.sql", parseConfig({}))).rejects.toThrow();
  });
});

describe("lineAtByteOffset", () => {
  it("handles multi-byte characters before the statement", () => {
    const sql = "-- café ☕\nSELECT 1;";
    const byteOffset = Buffer.byteLength("-- café ☕\n");
    expect(lineAtByteOffset(sql, byteOffset)).toBe(2);
  });
});
