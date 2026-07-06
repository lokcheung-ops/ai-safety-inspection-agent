import type { Finding, Report } from "./types.js";

const boundaries = [
  "OCR not implemented",
  "No hosted/live ADK or MCP integration",
  "Synthetic weather context only; no live weather API",
  "Read-only demo viewer",
  "No upload, chatbot, backend, database, or authentication",
  "No legal, audit, compliance, or accident-causation conclusions",
  "Ratings, recommendations, and source records remain unchanged",
] as const;

interface ManifestData {
  schema_version: string;
  counts: {
    report_count: number;
    individual_pdf_page_count: number;
    observation_count: number;
    weekly_summary_count: number;
    finding_count: number;
    finding_evidence_reference_count: number;
  };
  artifacts: Array<{ path: string; purpose: string; media_type: string; sha256: string }>;
}

interface ProjectionData { reports: Report[] }
interface BriefData { findings: Finding[] }

export function createDashboardData(
  projection: ProjectionData,
  brief: BriefData,
  manifest: ManifestData,
) {
  return {
    counts: {
      reports: manifest.counts.report_count,
      pages: manifest.counts.individual_pdf_page_count,
      observations: manifest.counts.observation_count,
      summaries: manifest.counts.weekly_summary_count,
      findings: manifest.counts.finding_count,
      tests: 97,
    },
    reports: projection.reports,
    findings: brief.findings,
    manifest,
    boundaries,
  };
}

export type DashboardData = ReturnType<typeof createDashboardData>;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load approved artifact: ${path}`);
  return response.json() as Promise<T>;
}

export async function loadDashboardData(): Promise<DashboardData> {
  const [projection, brief, manifest] = await Promise.all([
    fetchJson<ProjectionData>("/ui-projection.json"),
    fetchJson<BriefData>("/safety-review-brief.json"),
    fetchJson<ManifestData>("/manifest.json"),
  ]);
  return createDashboardData(projection, brief, manifest);
}

export function toPublicArtifactUrl(artifactPath: string): string {
  return artifactPath.replace(/^generated\/work-package-1/, "");
}

export function reportIdForFinding(finding: Finding): string {
  return finding.verified_evidence[0]?.report_id ?? "F3A-R01";
}

export function labelFindingType(findingType: string): string {
  return findingType
    .split("_")
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");
}
