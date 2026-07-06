const WEATHER_BOUNDARY_NOTES = [
  "synthetic weather context",
  "no live HKO integration",
  "no causation conclusion",
  "no rating change",
  "no recommendation edit",
  "no source record change",
  "human confirmation required",
] as const;

const R03_WEATHER_CONTEXT = {
  report_id: "F3A-R03",
  weather_event: "Red Rainstorm Warning Signal",
  context_type: "synthetic weather-review context for demo only",
  synthetic: true,
  live_hko_integration: false,
  causation_inference: false,
  review_topics: [
    "post-rain scaffold inspection",
    "drainage and water accumulation",
    "excavation stability if excavation was active",
    "temporary works",
    "material storage",
  ],
  reviewer_prompt:
    "Check whether existing evidence records post-rain scaffold, drainage, excavation-if-active, temporary works, and material-storage follow-up. Treat any gap as a prompt for human review only.",
  boundary_notes: [...WEATHER_BOUNDARY_NOTES],
} as const;

function normalizeReportId(reportId: string): string {
  const normalized = reportId.trim().toUpperCase();
  return normalized.startsWith("F3A-") ? normalized : `F3A-${normalized}`;
}

export function getWeatherContext(reportId: string) {
  const normalizedReportId = normalizeReportId(reportId);
  if (normalizedReportId !== R03_WEATHER_CONTEXT.report_id) {
    throw new Error(`No synthetic weather context exists for ${normalizedReportId}`);
  }
  return {
    ...R03_WEATHER_CONTEXT,
    review_topics: [...R03_WEATHER_CONTEXT.review_topics],
    boundary_notes: [...R03_WEATHER_CONTEXT.boundary_notes],
  };
}

export const WEATHER_CONTEXT_TOOLS = {
  get_weather_context: getWeatherContext,
} as const;
