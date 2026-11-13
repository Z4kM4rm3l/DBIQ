/*
 * PHASE 1, FINAL STRETCH: --dry-run
 *
 * Plan:
 *  1. Start a throwaway Postgres (Testcontainers for Node, or reuse
 *     DBIQ_DATABASE_URL when set, e.g. the docker-compose service).
 *  2. Wait until it actually accepts connections (Testcontainers handles this;
 *     otherwise retry `SELECT 1` with a timeout).
 *  3. Apply the existing schema (e.g. `alembic upgrade <from>`), then time
 *     the new migration inside a transaction.
 *  4. Report success/failure, duration, and any Postgres error with its line.
 *  5. Always tear the database down, even on failure (try/finally).
 */
export interface DryRunResult {
  ok: boolean;
  durationMs: number;
  error?: string;
}

export function dryRun(_sql: string, _databaseUrl: string | undefined): Promise<DryRunResult> {
  return Promise.reject(new Error("--dry-run is not implemented yet (see src/dry-run.ts)."));
}
