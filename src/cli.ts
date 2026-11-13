#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { Command, Option } from "commander";
import { renderAlembicSql } from "./alembic.js";
import { analyzeSql, type Finding } from "./analyze.js";
import { ConfigError, loadConfig, loadEnv } from "./config.js";
import { dryRun } from "./dry-run.js";
import { format, type OutputFormat } from "./report.js";

interface CommonOptions {
  config?: string;
  format: OutputFormat;
  dryRun?: boolean;
}

const formatOption = new Option("-f, --format <format>", "output format")
  .choices(["text", "github"])
  .default("text");

function finish(findings: Finding[], fmt: OutputFormat): void {
  const out = format(findings, fmt);
  if (out) console.log(out);
  if (findings.some((f) => f.severity === "error")) process.exitCode = 1;
}

async function maybeDryRun(sql: string, opts: CommonOptions): Promise<void> {
  if (opts.dryRun !== true) return;
  const env = loadEnv();
  const result = await dryRun(sql, env.DBIQ_DATABASE_URL);
  console.log(result.ok ? `Dry run passed in ${result.durationMs}ms.` : `Dry run failed: ${result.error ?? "unknown error"}`);
  if (!result.ok) process.exitCode = 1;
}

const program = new Command()
  .name("dbiq")
  .description("DBIQ: catch dangerous Postgres migrations before they hit production.")
  .version("0.1.0");

program
  .command("check")
  .description("Check one or more .sql migration files")
  .argument("<files...>", "SQL files to check")
  .option("-c, --config <path>", "path to dbiq.config.json")
  .addOption(formatOption)
  .option("--dry-run", "also apply the SQL to a throwaway Postgres")
  .action(async (files: string[], opts: CommonOptions) => {
    const config = await loadConfig(opts.config);
    const findings: Finding[] = [];
    for (const file of files) {
      const sql = await readFile(file, "utf8");
      findings.push(...(await analyzeSql(sql, file, config)));
      await maybeDryRun(sql, opts);
    }
    finish(findings, opts.format);
  });

program
  .command("alembic")
  .description("Render Alembic migrations to SQL (offline mode) and check them")
  .requiredOption("--from <revision>", "base revision, e.g. main's head")
  .option("--to <revision>", "target revision", "head")
  .option("--file <path>", "migration file to attribute findings to", "alembic")
  .option("--cwd <dir>", "directory containing alembic.ini", ".")
  .option("--alembic-bin <path>", "alembic executable", "alembic")
  .option("-c, --config <path>", "path to dbiq.config.json")
  .addOption(formatOption)
  .option("--dry-run", "also apply the SQL to a throwaway Postgres")
  .action(
    async (
      opts: CommonOptions & { from: string; to: string; file: string; cwd: string; alembicBin: string },
    ) => {
      const config = await loadConfig(opts.config);
      const sql = await renderAlembicSql(opts);
      finish(await analyzeSql(sql, opts.file, config), opts.format);
      await maybeDryRun(sql, opts);
    },
  );

program.parseAsync().catch((err: unknown) => {
  const message = err instanceof ConfigError || err instanceof Error ? err.message : String(err);
  console.error(`dbiq: ${message}`);
  process.exitCode = 2;
});
