import { describe, expect, it } from "vitest";

import { getWeatherContext, WEATHER_CONTEXT_TOOLS } from "../../src/mcp/weather-context.js";

describe("synthetic weather-review context tool", () => {
  it("exposes the get_weather_context tool name", () => {
    expect(Object.keys(WEATHER_CONTEXT_TOOLS)).toEqual(["get_weather_context"]);
  });

  it("returns synthetic Red Rainstorm context and reviewer prompts for R03", () => {
    const result = getWeatherContext("R03");

    expect(result).toMatchObject({
      report_id: "F3A-R03",
      weather_event: "Red Rainstorm Warning Signal",
      context_type: "synthetic weather-review context for demo only",
      synthetic: true,
      live_hko_integration: false,
      causation_inference: false,
    });
    expect(result.review_topics).toEqual([
      "post-rain scaffold inspection",
      "drainage and water accumulation",
      "excavation stability if excavation was active",
      "temporary works",
      "material storage",
    ]);
    expect(result.boundary_notes).toContain("human confirmation required");
  });

  it("rejects reports without synthetic weather context", () => {
    expect(() => getWeatherContext("R02")).toThrow(/no synthetic weather context/i);
  });
});
