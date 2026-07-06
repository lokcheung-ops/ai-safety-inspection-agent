export const AGENT_DEMO_TRACE = {
  title: "AI Safety Inspection Evidence Review Agent",
  mode: "Static demo trace · Example agent run",
  input: "Review R03 for weather-related follow-up gaps.",
  tool_calls: [
    "get_weather_context(R03)",
    "list_findings()",
    "get_finding_evidence(FINDING-01, FINDING-02, FINDING-04, FINDING-05)",
    "get_report_page_reference(R03, 1)",
    "verify_artifact_checksums()",
  ],
  brief: {
    title: "Weather-context Review Brief",
    summary:
      "Synthetic Red Rainstorm Warning Signal context exists for R03. Approved safety evidence and Pending findings were reviewed without changing them.",
    topics: [
      "Post-rain scaffold inspection",
      "Drainage and water accumulation",
      "Excavation stability if excavation was active",
      "Temporary works",
      "Material storage",
    ],
    potential_gap:
      "If approved recommendations do not record relevant post-rain checks, treat that absence as a potential follow-up prompt for human review — not a new safety finding.",
    actions: [
      "Compare the synthetic review topics with approved R03 recommendations and dated follow-up evidence.",
      "Confirm whether excavation activity or temporary works were present before applying those prompts.",
      "Keep every finding Pending and record any auditor decision outside this static example.",
    ],
  },
  boundary_notes: [
    "Synthetic weather-review context for demo only",
    "No live HKO or weather API claim",
    "No causation conclusion",
    "No rating, recommendation, finding-status, or source-record change",
    "Human auditor review required",
  ],
} as const;
