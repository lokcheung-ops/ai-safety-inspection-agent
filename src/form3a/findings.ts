import type { FieldCatalogue } from "./contracts.js";
import type { ExtractionReviewData, NormalizedData } from "./normalized-contracts.js";
import type { Gate4dUiProjection } from "./ui-projection.js";

export const SAFETY_REVIEW_BRIEF_PATH =
  "generated/work-package-1/safety-review-brief.json";

export type FindingType =
  | "repeated_or_worsening_rating"
  | "improved_then_recurred"
  | "rating_recommendation_inconsistency"
  | "poor_without_recommendation"
  | "missing_follow_up_evidence";

export interface Gate5Sources {
  canonical_fixture: string;
  field_catalogue: string;
  normalized_data: string;
  extraction_review_cases: string;
  normalized_xlsx: string;
  pdf_directory: string;
  combined_pdf: string;
  ui_projection: string;
}

export interface FindingEvidence {
  observation_id: string;
  report_id: string;
  page_number: number;
  section_id: string;
  section_label: string;
  item_id: string;
  item_label: string;
  inspection_date: string;
  weekday: string;
  rating: string | null;
  weekly_summary_id: string;
  weekly_dominant_rating: string | null;
  recommendation_id: string | null;
  recommendation: string | null;
  source_reference: NormalizedData["observations"][number]["source_reference"];
  individual_pdf_reference: {
    artifact_path: string;
    page_number: number;
  };
  combined_pdf_reference: {
    artifact_path: string;
    page_number: number;
  };
}

export interface SafetyFinding {
  finding_id: string;
  finding_type: FindingType;
  title: string;
  verified_evidence: FindingEvidence[];
  interpretation: string;
  suggested_action: string;
  safety_review_status: "Pending";
}

export interface SafetyReviewBrief {
  schema_version: "1.0.0";
  fixture_version: string;
  source_catalogue_version: string;
  brief_title: "Safety Review Brief";
  sources: Gate5Sources;
  findings: SafetyFinding[];
  extraction_review: {
    separation_notice: string;
    extraction_review_notice: string;
    cases: ExtractionReviewData["cases"];
  };
}

type WeeklySummary = NormalizedData["weekly_summaries"][number];
type Recommendation = NormalizedData["recommendations"][number];

export function deriveSafetyReviewBrief(
  catalogue: FieldCatalogue,
  normalizedData: NormalizedData,
  extractionReviewData: ExtractionReviewData,
  projection: Gate4dUiProjection,
  sources: Gate5Sources,
): SafetyReviewBrief {
  const scaffoldItemId = "working_at_height_scaffolds";
  const reportOrder = new Map(projection.report_order.map((reportId, index) => [reportId, index]));
  const scaffoldSummaries = normalizedData.weekly_summaries
    .filter((summary) => summary.item_id === scaffoldItemId)
    .sort(
      (left, right) =>
        reportOrder.get(left.report_id)! - reportOrder.get(right.report_id)!,
    );

  const repeatedPair = findSummaryPattern(scaffoldSummaries, ["P", "P"]);
  const recurrenceWindow = findSummaryPattern(scaffoldSummaries, ["P", "S", "P"]);
  const intentionalRecommendation = only(
    normalizedData.recommendations.filter(
      (recommendation) =>
        recommendation.intentional_case === "rating_recommendation_inconsistency",
    ),
    "intentional ladder inconsistency",
  );
  const poorGeneralObservation = normalizedData.observations.find(
    (observation) =>
      observation.rating === "P" &&
      observation.recommendation_id === null &&
      observation.section_id === "general",
  );
  if (poorGeneralObservation === undefined) {
    throw new Error("Missing Poor General observation without recommendation");
  }
  const missingFollowUpRecommendation = only(
    normalizedData.recommendations.filter((recommendation) =>
      /follow-up evidence does not confirm completion/i.test(recommendation.recommendation),
    ),
    "missing follow-up evidence recommendation",
  );

  const evidence = (observationId: string): FindingEvidence =>
    buildEvidence(
      observationId,
      catalogue,
      normalizedData,
      projection,
    );
  const scaffoldEvidence = (summary: WeeklySummary): FindingEvidence =>
    evidence(linkedRecommendationObservation(summary, normalizedData.recommendations));

  const findings: SafetyFinding[] = [
    {
      finding_id: "FINDING-01",
      finding_type: "repeated_or_worsening_rating",
      title: "Repeated Poor scaffold rating",
      verified_evidence: repeatedPair.map(scaffoldEvidence),
      interpretation:
        "The scaffold weekly dominant rating remained Poor in two consecutive reports, R02 and R03.",
      suggested_action:
        "Review the recorded scaffold corrective actions and retain dated evidence of the follow-up checks.",
      safety_review_status: "Pending",
    },
    {
      finding_id: "FINDING-02",
      finding_type: "improved_then_recurred",
      title: "Scaffold improvement followed by recurrence",
      verified_evidence: recurrenceWindow.map(scaffoldEvidence),
      interpretation:
        "The scaffold weekly dominant rating changed from Poor in R03 to Satisfactory in R04, then returned to Poor in R05.",
      suggested_action:
        "Review whether the recorded R04 corrective work remained effective and document the R05 follow-up check.",
      safety_review_status: "Pending",
    },
    {
      finding_id: "FINDING-03",
      finding_type: "rating_recommendation_inconsistency",
      title: "Ladder rating and recommendation inconsistency",
      verified_evidence: intentionalRecommendation.linked_observation_ids.map(evidence),
      interpretation:
        "The linked ladder observation is rated Good while its recommendation records a damaged side rail requiring corrective action; the recorded rating is unchanged.",
      suggested_action:
        "Ask a professional reviewer to confirm the source entry and decide whether any rating correction is appropriate.",
      safety_review_status: "Pending",
    },
    {
      finding_id: "FINDING-04",
      finding_type: "poor_without_recommendation",
      title: "Poor housekeeping observation without recommendation",
      verified_evidence: [evidence(poorGeneralObservation.observation_id)],
      interpretation:
        "The General / Housekeeping observation is rated Poor and has no linked recommendation in the approved data.",
      suggested_action:
        "Review the source record and add a recommendation or follow-up record only if supported by professional review.",
      safety_review_status: "Pending",
    },
    {
      finding_id: "FINDING-05",
      finding_type: "missing_follow_up_evidence",
      title: "Scaffold follow-up evidence not confirmed",
      verified_evidence: missingFollowUpRecommendation.linked_observation_ids.map(evidence),
      interpretation:
        "The R03 scaffold recommendation explicitly states that the available follow-up evidence does not confirm completion.",
      suggested_action:
        "Provide and retain dated evidence after the recorded scaffold corrective work is completed.",
      safety_review_status: "Pending",
    },
  ];

  return validateSafetyReviewBrief({
    schema_version: "1.0.0",
    fixture_version: normalizedData.fixture_version,
    source_catalogue_version: normalizedData.source_catalogue_version,
    brief_title: "Safety Review Brief",
    sources,
    findings,
    extraction_review: {
      separation_notice:
        "Extraction review cases are separate data-quality review items and are not safety findings.",
      extraction_review_notice: extractionReviewData.extraction_review_notice,
      cases: extractionReviewData.cases,
    },
  });
}

function findSummaryPattern(
  summaries: WeeklySummary[],
  pattern: Array<string | null>,
): WeeklySummary[] {
  const start = summaries.findIndex((_, index) =>
    pattern.every(
      (rating, offset) => summaries[index + offset]?.weekly_dominant_rating === rating,
    ),
  );
  if (start < 0) throw new Error(`Missing weekly rating pattern: ${pattern.join(",")}`);
  return summaries.slice(start, start + pattern.length);
}

function linkedRecommendationObservation(
  summary: WeeklySummary,
  recommendations: Recommendation[],
): string {
  const observationIds = new Set(summary.observation_ids);
  const matches = recommendations.flatMap((recommendation) =>
    recommendation.linked_observation_ids.filter((id) => observationIds.has(id)),
  );
  return only(matches, `linked recommendation observation for ${summary.summary_id}`);
}

function buildEvidence(
  observationId: string,
  catalogue: FieldCatalogue,
  normalizedData: NormalizedData,
  projection: Gate4dUiProjection,
): FindingEvidence {
  const observation = findById(
    normalizedData.observations,
    (entry) => entry.observation_id === observationId,
    `observation ${observationId}`,
  );
  const summary = findById(
    normalizedData.weekly_summaries,
    (entry) =>
      entry.report_id === observation.report_id && entry.item_id === observation.item_id,
    `weekly summary for ${observationId}`,
  );
  const recommendation =
    observation.recommendation_id === null
      ? null
      : findById(
          normalizedData.recommendations,
          (entry) => entry.recommendation_id === observation.recommendation_id,
          `recommendation for ${observationId}`,
        );
  const section = findById(
    catalogue.sections,
    (entry) => entry.section_id === observation.section_id,
    `section ${observation.section_id}`,
  );
  const item = findById(
    section.items,
    (entry) => entry.item_id === observation.item_id,
    `item ${observation.item_id}`,
  );
  const report = findById(
    projection.reports,
    (entry) => entry.report_id === observation.report_id,
    `projection report ${observation.report_id}`,
  );
  const page = findById(
    report.pages,
    (entry) => entry.page_number === observation.page_number,
    `projection page for ${observationId}`,
  );

  return {
    observation_id: observation.observation_id,
    report_id: observation.report_id,
    page_number: observation.page_number,
    section_id: observation.section_id,
    section_label: `${section.label_en} / ${section.label_zh}`,
    item_id: observation.item_id,
    item_label: `${item.label_en} / ${item.label_zh}`,
    inspection_date: observation.inspection_date,
    weekday: observation.weekday,
    rating: observation.rating,
    weekly_summary_id: summary.summary_id,
    weekly_dominant_rating: summary.weekly_dominant_rating,
    recommendation_id: recommendation?.recommendation_id ?? null,
    recommendation: recommendation?.recommendation ?? null,
    source_reference: observation.source_reference,
    individual_pdf_reference: page.individual_pdf_reference,
    combined_pdf_reference: page.combined_pdf_reference,
  };
}

export function validateSafetyReviewBrief(brief: SafetyReviewBrief): SafetyReviewBrief {
  const requiredTypes: FindingType[] = [
    "repeated_or_worsening_rating",
    "improved_then_recurred",
    "rating_recommendation_inconsistency",
    "poor_without_recommendation",
    "missing_follow_up_evidence",
  ];
  if (
    brief.findings.length !== requiredTypes.length ||
    brief.findings.some((finding, index) => finding.finding_type !== requiredTypes[index])
  ) {
    throw new Error("Gate 5 findings do not contain the required ordered finding types");
  }
  if (new Set(brief.findings.map((finding) => finding.finding_id)).size !== brief.findings.length) {
    throw new Error("Gate 5 finding IDs must be unique");
  }
  if (
    brief.findings.some(
      (finding) =>
        finding.safety_review_status !== "Pending" || finding.verified_evidence.length === 0,
    )
  ) {
    throw new Error("Gate 5 findings require Pending status and verified evidence");
  }
  const serializedFindings = JSON.stringify(brief.findings);
  if (
    /weather|safety.?alert|legal|compliance|audit conclusion|accident causation|caused by|ocr/i.test(
      serializedFindings,
    ) ||
    /"remarks?"\s*:/i.test(serializedFindings)
  ) {
    throw new Error("Gate 5 findings contain prohibited fields or claims");
  }
  return brief;
}

function only<T>(values: T[], description: string): T {
  if (values.length !== 1) throw new Error(`Expected exactly one ${description}`);
  return values[0]!;
}

function findById<T>(values: T[], predicate: (value: T) => boolean, description: string): T {
  const value = values.find(predicate);
  if (value === undefined) throw new Error(`Missing ${description}`);
  return value;
}
