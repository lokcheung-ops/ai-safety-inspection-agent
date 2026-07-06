import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const MANIFEST_PATH = "generated/work-package-1/manifest.json";
const FINDINGS_PATH = "generated/work-package-1/safety-review-brief.json";
const UI_PROJECTION_PATH = "generated/work-package-1/ui-projection.json";

export const EVIDENCE_TOOL_BOUNDARY_NOTES = [
  "no source record change",
  "no rating change",
  "no finding status change",
  "no recommendation edit",
  "human confirmation required",
] as const;

type ManifestArtifact = {
  path: string;
  purpose: string;
  media_type: string;
  sha256: string;
};

type Manifest = {
  schema_version: string;
  work_package: string;
  generation: {
    deterministic: boolean;
    checksum_algorithm: string;
    reproducibility_mode: string;
  };
  counts: Record<string, number>;
  artifacts: ManifestArtifact[];
};

export type FindingEvidence = {
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
  recommendation_id: string | null;
  recommendation?: string;
  source_reference: { display_reference: string };
  individual_pdf_reference: { artifact_path: string; page_number: number };
  combined_pdf_reference: { artifact_path: string; page_number: number };
};

export type ApprovedFinding = {
  finding_id: string;
  finding_type: string;
  title: string;
  verified_evidence: FindingEvidence[];
  interpretation: string;
  suggested_action: string;
  safety_review_status: "Pending";
};

type SafetyReviewBrief = { findings: ApprovedFinding[] };

type UiProjection = {
  reports: Array<{
    report_id: string;
    pages: Array<{
      page_number: number;
      page_indicator: string;
      section_ids: string[];
      item_ids: string[];
      individual_pdf_reference: { artifact_path: string; page_number: number };
      combined_pdf_reference: { artifact_path: string; page_number: number };
    }>;
  }>;
};

function boundaryNotes(): string[] {
  return [...EVIDENCE_TOOL_BOUNDARY_NOTES];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function normalizeReportId(reportId: string): string {
  const normalized = reportId.trim().toUpperCase();
  return normalized.startsWith("F3A-") ? normalized : `F3A-${normalized}`;
}

export function getManifestSummary() {
  const manifest = readJson<Manifest>(MANIFEST_PATH);
  return {
    schema_version: manifest.schema_version,
    work_package: manifest.work_package,
    generation: manifest.generation,
    counts: manifest.counts,
    artifact_count: manifest.artifacts.length,
    boundary_notes: boundaryNotes(),
  };
}

export function listFindings() {
  const brief = readJson<SafetyReviewBrief>(FINDINGS_PATH);
  return {
    findings: brief.findings.map((finding) => ({
      finding_id: finding.finding_id,
      finding_type: finding.finding_type,
      title: finding.title,
      safety_review_status: finding.safety_review_status,
      evidence_count: finding.verified_evidence.length,
      report_ids: [...new Set(finding.verified_evidence.map((evidence) => evidence.report_id))],
    })),
    boundary_notes: boundaryNotes(),
  };
}

export function getFindingEvidence(findingId: string) {
  const brief = readJson<SafetyReviewBrief>(FINDINGS_PATH);
  const finding = brief.findings.find((entry) => entry.finding_id === findingId);
  if (!finding) throw new Error(`Approved finding not found: ${findingId}`);
  return { finding, boundary_notes: boundaryNotes() };
}

export function getReportPageReference(reportId: string, pageNumber: number) {
  const normalizedReportId = normalizeReportId(reportId);
  const projection = readJson<UiProjection>(UI_PROJECTION_PATH);
  const report = projection.reports.find((entry) => entry.report_id === normalizedReportId);
  if (!report) throw new Error(`Approved report not found: ${normalizedReportId}`);
  const page = report.pages.find((entry) => entry.page_number === pageNumber);
  if (!page) throw new Error(`Approved page not found: ${normalizedReportId} page ${pageNumber}`);
  return {
    report_id: normalizedReportId,
    page_number: page.page_number,
    page_indicator: page.page_indicator,
    section_ids: page.section_ids,
    item_ids: page.item_ids,
    individual_pdf_reference: page.individual_pdf_reference,
    combined_pdf_reference: page.combined_pdf_reference,
    boundary_notes: boundaryNotes(),
  };
}

export function verifyArtifactChecksums() {
  const manifest = readJson<Manifest>(MANIFEST_PATH);
  const artifacts = manifest.artifacts.map((artifact) => {
    const actualSha256 = createHash("sha256").update(readFileSync(artifact.path)).digest("hex");
    return {
      path: artifact.path,
      expected_sha256: artifact.sha256,
      actual_sha256: actualSha256,
      matches: actualSha256 === artifact.sha256,
    };
  });
  return {
    checksum_algorithm: "SHA-256",
    verified: artifacts.every((artifact) => artifact.matches),
    artifacts,
    boundary_notes: boundaryNotes(),
  };
}

export const EVIDENCE_TOOLS = {
  get_manifest_summary: getManifestSummary,
  list_findings: listFindings,
  get_finding_evidence: getFindingEvidence,
  get_report_page_reference: getReportPageReference,
  verify_artifact_checksums: verifyArtifactChecksums,
} as const;
