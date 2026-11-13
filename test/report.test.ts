import { describe, expect, it } from "vitest";
import type { Finding } from "../src/analyze.js";
import { formatGithub, formatText } from "../src/report.js";

const finding: Finding = {
  ruleId: "drop-column",
  severity: "error",
  message: "Dropping column. 100% risky\nsecond line",
  file: "migrations/0004,v2.py",
  line: 5,
};

describe("formatGithub", () => {
  it("emits an escaped workflow-command annotation", () => {
    expect(formatGithub([finding])).toBe(
      "::error file=migrations/0004%2Cv2.py,line=5,title=DBIQ%3A drop-column::Dropping column. 100%25 risky%0Asecond line",
    );
  });
});

describe("formatText", () => {
  it("says so when there is nothing to report", () => {
    expect(formatText([])).toBe("No dangerous operations found.");
  });

  it("summarizes counts", () => {
    expect(formatText([finding])).toContain("1 finding(s), 1 error(s).");
  });
});
