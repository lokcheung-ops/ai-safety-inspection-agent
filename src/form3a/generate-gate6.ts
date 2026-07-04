import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { loadFieldCatalogue } from "./catalogue.js";
import type { SafetyReviewBrief } from "./findings.js";
import { loadCanonicalFixture } from "./fixture.js";
import {
  loadExtractionReviewData,
  loadNormalizedData,
  serializeDeterministicJson,
} from "./normalized.js";
import {
  validateGate4dUiProjection,
  type Gate4dUiProjection,
} from "./ui-projection.js";

const MANIFEST_PATH = "generated/work-package-1/manifest.json";
const STAGE_COMMANDS = [
  "generate:gate4a",
  "generate:gate4b",
  "generate:gate4c",
  "generate:gate4d",
  "generate:gate5",
] as const;

const ARTIFACTS = [
  {
    path: "generated/work-package-1/normalized-data.json",
    purpose: "Normalized daily observations, weekly summaries, and recommendations",
    media_type: "application/json",
  },
  {
    path: "generated/work-package-1/extraction-review-cases.json",
    purpose: "Extraction data-quality cases kept separate from safety findings",
    media_type: "application/json",
  },
  {
    path: "generated/work-package-1/normalized-data.xlsx",
    purpose: "Seven-sheet review workbook with frozen headers and source traceability",
    media_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  ...(["F3A-R01", "F3A-R02", "F3A-R03", "F3A-R04", "F3A-R05"] as const).map(
    (reportId) => ({
      path: `generated/work-package-1/pdfs/${reportId}.pdf`,
      purpose: `${reportId} four-page bilingual Form 3A report`,
      media_type: "application/pdf",
    }),
  ),
  {
    path: "generated/work-package-1/pdfs/form3a-five-week-combined.pdf",
    purpose: "Combined twenty-page PDF containing all five reports in order",
    media_type: "application/pdf",
  },
  {
    path: "generated/work-package-1/ui-projection.json",
    purpose: "UI-friendly report switching and single-page PDF reference data",
    media_type: "application/json",
  },
  {
    path: "generated/work-package-1/safety-review-brief.json",
    purpose: "Five deterministic, evidence-linked safety review findings",
    media_type: "application/json",
  },
] as const;

for (const command of STAGE_COMMANDS) runStage(command);

const fixture = loadCanonicalFixture();
const catalogue = loadFieldCatalogue();
const normalized = loadNormalizedData();
const extractionReview = loadExtractionReviewData();
const projection = validateGate4dUiProjection(
  JSON.parse(readFileSync("generated/work-package-1/ui-projection.json", "utf8")) as Gate4dUiProjection,
);
const brief = JSON.parse(
  readFileSync("generated/work-package-1/safety-review-brief.json", "utf8"),
) as SafetyReviewBrief;

const individualPdfPaths = ARTIFACTS.filter(
  (artifact) => artifact.media_type === "application/pdf" && !artifact.path.includes("combined"),
).map((artifact) => artifact.path);
const individualPdfPageCount = await countPdfPages(individualPdfPaths);
const combinedPdfPageCount = await countPdfPages([
  "generated/work-package-1/pdfs/form3a-five-week-combined.pdf",
]);

const manifest = {
  schema_version: "1.0.0",
  work_package: "Work Package 1",
  fixture_version: fixture.fixture_version,
  source_catalogue_version: catalogue.catalogue_version,
  canonical_source_path: "data/form3a/canonical-five-week-fixture.json",
  catalogue_source_path: "data/form3a/field-catalogue.json",
  manifest_path: MANIFEST_PATH,
  generation: {
    deterministic: true,
    orchestrator_command: "corepack pnpm generate:gate6",
    stage_commands: STAGE_COMMANDS.map((command) => `corepack pnpm ${command}`),
    checksum_algorithm: "SHA-256",
    reproducibility_mode: "byte-identical committed artifacts",
  },
  counts: {
    report_count: fixture.reports.length,
    pdf_file_count: individualPdfPaths.length + 1,
    individual_pdf_count: individualPdfPaths.length,
    individual_pdf_page_count: individualPdfPageCount,
    combined_pdf_page_count: combinedPdfPageCount,
    observation_count: normalized.observations.length,
    weekly_summary_count: normalized.weekly_summaries.length,
    recommendation_count: normalized.recommendations.length,
    extraction_review_case_count: extractionReview.cases.length,
    finding_count: brief.findings.length,
    finding_evidence_reference_count: brief.findings.reduce(
      (count, finding) => count + finding.verified_evidence.length,
      0,
    ),
    ui_report_count: projection.reports.length,
    ui_page_reference_count: projection.reports.reduce(
      (count, report) => count + report.pages.length,
      0,
    ),
  },
  artifacts: ARTIFACTS.map((artifact) => {
    if (!existsSync(artifact.path)) throw new Error(`Missing Gate 6 artifact: ${artifact.path}`);
    return { ...artifact, sha256: sha256(readFileSync(artifact.path)) };
  }),
};

writeFileSync(MANIFEST_PATH, serializeDeterministicJson(manifest), "utf8");

function runStage(command: string): void {
  const environment: NodeJS.ProcessEnv = { ...process.env, CI: "true" };
  delete environment.GATE4C_OUTPUT_DIR;
  delete environment.GATE4D_OUTPUT_PATH;
  delete environment.GATE5_OUTPUT_PATH;
  const result = spawnSync("corepack", ["pnpm", command], {
    cwd: process.cwd(),
    env: environment,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} failed\n${result.stdout ?? ""}${result.stderr ?? ""}`,
    );
  }
}

async function countPdfPages(paths: string[]): Promise<number> {
  let pageCount = 0;
  for (const pdfPath of paths) {
    const document = await getDocument({
      data: new Uint8Array(readFileSync(pdfPath)),
      useSystemFonts: false,
    }).promise;
    pageCount += document.numPages;
    await document.destroy();
  }
  return pageCount;
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
