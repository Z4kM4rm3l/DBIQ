import type { Rule } from "./types.js";

/*
 * YOUR RULES TO WRITE.
 * Each one is a small pure function. Use drop-column.ts as the pattern, and
 * dump a real statement's AST to see its shape:
 *
 *   node -e 'require("libpg-query").parse("CREATE INDEX i ON t(a)").then(r => console.log(JSON.stringify(r, null, 2)))'
 *
 * Then replace the `return []` and turn the matching `it.todo` in
 * test/rules.test.ts into a real test.
 */

export const dropTable: Rule = {
  id: "drop-table",
  description: "Dropping a table is irreversible and breaks any code still using it.",
  defaultSeverity: "error",
  // Hint: DropStmt with removeType "OBJECT_TABLE".
  check: () => [],
};

export const createIndexNonConcurrent: Rule = {
  id: "create-index-non-concurrent",
  description: "CREATE INDEX without CONCURRENTLY blocks writes to the table while it builds.",
  defaultSeverity: "error",
  // Hint: IndexStmt where `concurrent` is not true.
  check: () => [],
};

export const setNotNull: Rule = {
  id: "set-not-null",
  description: "SET NOT NULL scans the whole table under an exclusive lock.",
  defaultSeverity: "warning",
  // Hint: AlterTableCmd subtype "AT_SetNotNull".
  check: () => [],
};

export const alterColumnType: Rule = {
  id: "alter-column-type",
  description: "Changing a column's type usually rewrites the entire table under an exclusive lock.",
  defaultSeverity: "error",
  // Hint: AlterTableCmd subtype "AT_AlterColumnType".
  check: () => [],
};

export const constraintNotValid: Rule = {
  id: "constraint-not-valid",
  description:
    "Adding a foreign key or check constraint validates every existing row under a lock. Add it NOT VALID, then VALIDATE separately.",
  defaultSeverity: "warning",
  // Hint: AlterTableCmd "AT_AddConstraint" whose Constraint contype is
  // CONSTR_FOREIGN or CONSTR_CHECK and `skip_validation` is not true.
  check: () => [],
};

export const rename: Rule = {
  id: "rename",
  description: "Renaming a table or column breaks running code that uses the old name.",
  defaultSeverity: "error",
  // Hint: RenameStmt with renameType "OBJECT_TABLE" or "OBJECT_COLUMN".
  check: () => [],
};
