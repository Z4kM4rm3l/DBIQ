import { parse, type Node } from "libpg-query";
import { describe, expect, it } from "vitest";
import { dropTable } from "../src/rules/stubs.js";
import { dropColumn } from "../src/rules/drop-column.js";

/** Parse a single SQL statement into the AST node a rule receives. */
async function stmt(sql: string): Promise<Node> {
  const { stmts = [] } = await parse(sql);
  const node = stmts[0]?.stmt;
  if (node === undefined) throw new Error(`no statement parsed from: ${sql}`);
  return node;
}

describe("drop-column", () => {
  it("flags ALTER TABLE ... DROP COLUMN", async () => {
    const v = dropColumn.check(await stmt("ALTER TABLE users DROP COLUMN email"));
    expect(v).toHaveLength(1);
    expect(v[0]?.message).toContain('"email"');
    expect(v[0]?.message).toContain('"users"');
  });

  it("flags every dropped column in one statement", async () => {
    const v = dropColumn.check(await stmt("ALTER TABLE users DROP COLUMN a, DROP COLUMN b"));
    expect(v).toHaveLength(2);
  });

  it("ignores ADD COLUMN", async () => {
    expect(dropColumn.check(await stmt("ALTER TABLE users ADD COLUMN age int"))).toEqual([]);
  });

  it("ignores unrelated statements", async () => {
    expect(dropColumn.check(await stmt("SELECT 1"))).toEqual([]);
  });
});

// Your turn: write these by hand, following the drop-column tests above.
describe("drop-table", () => {
it("flags DROP TABLE", async () => {
  const v = dropTable.check(await stmt("DROP TABLE users"));
  expect(v).toHaveLength(1);
  expect(v[0]?.message).toContain('"users"');
});

it("flags every table in DROP TABLE a, b", async () => {
  expect(dropTable.check(await stmt("DROP TABLE a, b"))).toHaveLength(2);
});

it("ignores DROP INDEX", async () => {
  expect(dropTable.check(await stmt("DROP INDEX ix_users_email"))).toEqual([]);
});

describe("create-index-non-concurrent", () => {
  it.todo("flags CREATE INDEX without CONCURRENTLY");
  it.todo("allows CREATE INDEX CONCURRENTLY");
});

describe("set-not-null", () => {
  it.todo("flags ALTER COLUMN ... SET NOT NULL");
  it.todo("ignores DROP NOT NULL");
});

describe("alter-column-type", () => {
  it.todo("flags ALTER COLUMN ... TYPE");
});

describe("constraint-not-valid", () => {
  it.todo("flags ADD FOREIGN KEY without NOT VALID");
  it.todo("flags ADD CHECK without NOT VALID");
  it.todo("allows ADD FOREIGN KEY ... NOT VALID");
  it.todo("ignores ADD PRIMARY KEY and UNIQUE (different rule territory)");
});

describe("rename", () => {
  it.todo("flags ALTER TABLE ... RENAME TO");
  it.todo("flags ALTER TABLE ... RENAME COLUMN");
});
