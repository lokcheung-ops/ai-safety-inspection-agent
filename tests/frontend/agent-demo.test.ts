import fs from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { AGENT_DEMO_TRACE } from "../../frontend/agent-demo-data.js";

describe("static /agent-demo trace", () => {
  it("shows one honest, static R03 example with the required tool flow and boundaries", () => {
    expect(AGENT_DEMO_TRACE.title).toBe("AI Safety Inspection Evidence Review Agent");
    expect(AGENT_DEMO_TRACE.mode).toBe("Static demo trace · Example agent run");
    expect(AGENT_DEMO_TRACE.input).toBe("Review R03 for weather-related follow-up gaps.");
    expect(AGENT_DEMO_TRACE.tool_calls).toEqual([
      "get_weather_context(R03)",
      "list_findings()",
      "get_finding_evidence(FINDING-01, FINDING-02, FINDING-04, FINDING-05)",
      "get_report_page_reference(R03, 1)",
      "verify_artifact_checksums()",
    ]);
    expect(AGENT_DEMO_TRACE.boundary_notes).toEqual([
      "Synthetic weather-review context for demo only",
      "No live HKO or weather API claim",
      "No causation conclusion",
      "No rating, recommendation, finding-status, or source-record change",
      "Human auditor review required",
    ]);
  });

  it("wires a static frontend route with no backend or secret requirement", async () => {
    const [app, component, vercel] = await Promise.all([
      fs.readFile("frontend/App.tsx", "utf8"),
      fs.readFile("frontend/AgentDemo.tsx", "utf8"),
      fs.readFile("vercel.json", "utf8"),
    ]);

    expect(app).toContain('window.location.pathname === "/agent-demo"');
    expect(component).toContain("ADK = reviewer-agent runtime");
    expect(component).toContain("MCP = read-only evidence and weather-context tools");
    expect(component).toContain("AGENT_DEMO_TRACE.mode");
    expect(component).not.toMatch(/live chatbot|api key|google_api_key|nim/i);
    expect(JSON.parse(vercel)).toMatchObject({
      rewrites: [{ source: "/agent-demo", destination: "/index.html" }],
    });
  });
});
