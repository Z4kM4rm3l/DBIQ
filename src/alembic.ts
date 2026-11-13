import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export interface AlembicOptions {
  /** Revision to start from, e.g. the main branch's head. Only migrations after it are rendered. */
  from: string;
  to: string;
  cwd: string;
  alembicBin: string;
}

/**
 * Renders migrations to SQL with Alembic's offline mode:
 *   alembic upgrade <from>:<to> --sql
 *
 * Known limitation: migrations that read from the database (op.get_bind(),
 * data migrations) can't run offline. Those surface here as a failed command,
 * and the right answer is --dry-run against a real database.
 */
export async function renderAlembicSql(opts: AlembicOptions): Promise<string> {
  try {
    const { stdout } = await run(opts.alembicBin, ["upgrade", `${opts.from}:${opts.to}`, "--sql"], {
      cwd: opts.cwd,
      maxBuffer: 32 * 1024 * 1024,
    });
    return stdout;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `alembic offline rendering failed. If this migration reads from the database, ` +
        `it can't be analyzed statically; use --dry-run instead.\n${detail}`,
      { cause: err },
    );
  }
}
