import {
  getFindingEvidence,
  getReportPageReference,
  listFindings,
  verifyArtifactChecksums,
} from "../mcp/evidence-tools.js";
import { getWeatherContext } from "../mcp/weather-context.js";

const TOPIC_TERMS: Record<string, string[]> = {
  "post-rain scaffold inspection": ["post-rain", "rain inspection"],
  "drainage and water accumulation": ["drainage", "water accumulation"],
  "excavation stability if excavation was active": ["excavation stability", "excavation check"],
  "temporary works": ["temporary works"],
  "material storage": ["material storage"],
};

export function runEvidenceReviewAgent({ reportId }: { reportId: string }) {
  const shortReportId = reportId.trim().toUpperCase().replace(/^F3A-/, "");
  const normalizedReportId = `F3A-${shortReportId}`;
  const weatherContext = getWeatherContext(normalizedReportId);
  const findingsIndex = listFindings();
  const relevantFindingIds = findingsIndex.findings
    .filter((finding) => finding.report_ids.includes(normalizedReportId))
    .map((finding) => finding.finding_id);
  const relevantFindings = relevantFindingIds.map(
    (findingId) => getFindingEvidence(findingId).finding,
  );
  const firstEvidence = relevantFindings.flatMap((finding) => finding.verified_evidence)
    .find((evidence) => evidence.report_id === normalizedReportId);
  if (!firstEvidence) throw new Error(`No approved finding evidence exists for ${normalizedReportId}`);
  const pageReference = getReportPageReference(normalizedReportId, firstEvidence.page_number);
  const checksumResult = verifyArtifactChecksums();

  const recommendationText = relevantFindings
    .flatMap((finding) => finding.verified_evidence)
    .filter((evidence) => evidence.report_id === normalizedReportId)
    .map((evidence) => evidence.recommendation ?? "")
    .join(" ")
    .toLowerCase();
  const missingTopics = weatherContext.review_topics.filter((topic) =>
    !(TOPIC_TERMS[topic] ?? []).some((term) => recommendationText.includes(term)),
  );

  return {
    product_name: "AI Safety Inspection Evidence Review Agent",
    runtime: "deterministic ADK-style local runner",
    user_request: `Review ${shortReportId} for weather-related follow-up gaps.`,
    tool_flow: [
      { tool: "get_weather_context", input: normalizedReportId, status: "success" },
      { tool: "list_findings", status: "success" },
      { tool: "get_finding_evidence", input: relevantFindingIds, status: "success" },
      {
        tool: "get_report_page_reference",
        input: { report_id: normalizedReportId, page_number: firstEvidence.page_number },
        status: "success",
      },
      {
        tool: "verify_artifact_checksums",
        status: checksumResult.verified ? "success" : "failed",
      },
    ],
    brief: {
      title: "Weather-context Review Brief",
      status: "tentative — human review required",
      summary: `Synthetic Red Rainstorm Warning Signal context exists for ${shortReportId}. Existing approved safety evidence and Pending findings were reviewed without changing them.`,
      relevant_review_topics: weatherContext.review_topics,
      existing_findings_reviewed: relevantFindings.map((finding) => ({
        finding_id: finding.finding_id,
        title: finding.title,
        safety_review_status: finding.safety_review_status,
        evidence_count: finding.verified_evidence.filter(
          (evidence) => evidence.report_id === normalizedReportId,
        ).length,
      })),
      source_page_reference: pageReference,
      potential_follow_up_items: missingTopics.map(
        (topic) =>
          `Potential missing follow-up item for human review: confirm whether ${topic} was required and recorded.`,
      ),
      suggested_human_review_actions: [
        "Compare the synthetic weather-review topics with the approved R03 recommendations and dated follow-up evidence.",
        "Confirm whether excavation activity or temporary works were present before applying those review prompts.",
        "Record any auditor decision separately; do not edit the approved source artifacts through this demo.",
      ],
      boundary_notes: [
        "synthetic weather context only",
        "no live HKO claim",
        "no causation conclusion",
        "no rating change",
        "no recommendation edit",
        "no finding status change",
        "no source record change",
        "human review required",
      ],
    },
  };
}
