import { describe, expect, it } from "vitest";
import { ConfigError, loadEnv, parseConfig } from "../src/config.js";

describe("parseConfig", () => {
  it("applies defaults", () => {
    expect(parseConfig({})).toEqual({ rules: {}, ignoreTables: ["alembic_version"] });
  });

  it("rejects unknown rule ids", () => {
    expect(() => parseConfig({ rules: { "not-a-rule": "error" } })).toThrow(ConfigError);
  });

  it("rejects bad severities", () => {
    expect(() => parseConfig({ rules: { "drop-column": "loud" } })).toThrow(ConfigError);
  });

  it("rejects unknown top-level keys (catches typos)", () => {
    expect(() => parseConfig({ ignoreTable: ["x"] })).toThrow(ConfigError);
  });
});

describe("loadEnv", () => {
  it("accepts a postgres URL", () => {
    expect(loadEnv({ DBIQ_DATABASE_URL: "postgresql://u:p@localhost:5432/db" })).toEqual({
      DBIQ_DATABASE_URL: "postgresql://u:p@localhost:5432/db",
    });
  });

  it("rejects a non-postgres URL", () => {
    expect(() => loadEnv({ DBIQ_DATABASE_URL: "mysql://localhost/db" })).toThrow(ConfigError);
  });

  it("allows it to be unset", () => {
    expect(loadEnv({})).toEqual({});
  });
});
