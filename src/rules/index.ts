import { dropColumn } from "./drop-column.js";
import {
  alterColumnType,
  constraintNotValid,
  createIndexNonConcurrent,
  dropTable,
  rename,
  setNotNull,
} from "./stubs.js";
import type { Rule } from "./types.js";

export const ALL_RULES: readonly Rule[] = [
  dropColumn,
  dropTable,
  createIndexNonConcurrent,
  setNotNull,
  alterColumnType,
  constraintNotValid,
  rename,
];

export * from "./types.js";
