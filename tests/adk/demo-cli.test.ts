import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const SCRIPT_PATH = "scripts/run-adk-mcp-evidence-demo.ts";

describe("local ADK and MCP evidence demo", () => {
  it("declares the package scripts and prints the deterministic R03 tool trace", async () => {
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf8")) as {
      scripts?: Record<string, string>;
    };
    expect(existsSync(SCRIPT_PATH)).toBe(true);
    expect(packageJson.scripts?.["adk:mcp:demo"]).toBe(
      "node --import tsx scripts/run-adk-mcp-evidence-demo.ts",
    );
    expect(packageJson.scripts?.["test:mcp"]).toBe("vitest run tests/mcp");
    expect(packageJson.scripts?.["test:adk"]).toBe("vitest run tests/adk");

    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", SCRIPT_PATH, "--report", "R03"],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("AI Safety Inspection Evidence Review Agent");
    expect(result.stdout).toContain("Review R03 for weather-related follow-up gaps.");
    for (const call of [
      "get_weather_context(R03)",
      "list_findings()",
      "get_finding_evidence(...)",
      "get_report_page_reference(...)",
      "verify_artifact_checksums()",
    ]) {
      expect(result.stdout).toContain(`✓ ${call}`);
    }
    expect(result.stdout).toContain("Weather-context Review Brief");
    expect(result.stdout).toContain("no causation conclusion");
    expect(result.stdout).toContain("human review required");
  });
});
