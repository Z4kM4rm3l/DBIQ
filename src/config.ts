import { readFile } from "node:fs/promises";
import { z } from "zod";
import { RULE_IDS } from "./rules/types.js";

const ruleSetting = z.enum(["error", "warning", "off"]);

export const configSchema = z
  .object({
    /** Override a rule's severity, or turn it off. */
    rules: z.partialRecord(z.enum(RULE_IDS), ruleSetting).default({}),
    /** Statements touching these tables are skipped (Alembic's own bookkeeping by default). */
    ignoreTables: z.array(z.string().min(1)).default(["alembic_version"]),
  })
  .strict();

export type Config = z.infer<typeof configSchema>;

export const envSchema = z.object({
  /** Postgres URL used by --dry-run. Never logged. */
  DBIQ_DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }).optional(),
});

export type Env = z.infer<typeof envSchema>;

export class ConfigError extends Error {}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

export function parseConfig(raw: unknown): Config {
  const result = configSchema.safeParse(raw);
  if (!result.success) throw new ConfigError(`Invalid config:\n${formatIssues(result.error)}`);
  return result.data;
}

export async function loadConfig(path: string | undefined): Promise<Config> {
  if (path === undefined) return parseConfig({});
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch {
    throw new ConfigError(`Could not read config file: ${path}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ConfigError(`Config file is not valid JSON: ${path}`);
  }
  return parseConfig(json);
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) throw new ConfigError(`Invalid environment:\n${formatIssues(result.error)}`);
  return result.data;
}
