import { describe, expect, it } from "vitest";

import { runEvidenceReviewAgent } from "../../src/adk/evidence-review-agent.js";

describe("deterministic Evidence Review Agent", () => {
  it("runs the read-only tool flow and drafts a tentative R03 weather review brief", () => {
    const result = runEvidenceReviewAgent({ reportId: "R03" });
    const serialized = JSON.stringify(result);

    expect(result.product_name).toBe("AI Safety Inspection Evidence Review Agent");
    expect(result.user_request).toBe("Review R03 for weather-related follow-up gaps.");
    expect(result.tool_flow.map((step) => step.tool)).toEqual([
      "get_weather_context",
      "list_findings",
      "get_finding_evidence",
      "get_report_page_reference",
      "verify_artifact_checksums",
    ]);
    expect(result.tool_flow.every((step) => step.status === "success")).toBe(true);
    expect(result.brief.title).toBe("Weather-context Review Brief");
    expect(result.brief.summary).toMatch(/Synthetic Red Rainstorm Warning Signal context exists for R03/);
    expect(result.brief.relevant_review_topics).toContain("post-rain scaffold inspection");
    expect(result.brief.existing_findings_reviewed.length).toBeGreaterThan(0);
    expect(result.brief.potential_follow_up_items.length).toBeGreaterThan(0);
    expect(result.brief.suggested_human_review_actions.length).toBeGreaterThan(0);
    expect(serialized).toContain("no causation conclusion");
    expect(serialized).toContain("no rating change");
    expect(serialized).toContain("no recommendation edit");
    expect(serialized).toContain("no source record change");
    expect(serialized).toContain("human review required");
    expect(serialized).not.toContain('"safety_review_status":"Approved"');
  });
});
