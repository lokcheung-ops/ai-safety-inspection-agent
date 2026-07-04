import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { loadFieldCatalogue } from "./catalogue.js";
import {
  deriveSafetyReviewBrief,
  SAFETY_REVIEW_BRIEF_PATH,
  type Gate5Sources,
} from "./findings.js";
import {
  loadExtractionReviewData,
  loadNormalizedData,
  serializeDeterministicJson,
} from "./normalized.js";
import {
  validateGate4dUiProjection,
  type Gate4dUiProjection,
} from "./ui-projection.js";

const sources: Gate5Sources = {
  canonical_fixture: "data/form3a/canonical-five-week-fixture.json",
  field_catalogue: "data/form3a/field-catalogue.json",
  normalized_data: "generated/work-package-1/normalized-data.json",
  extraction_review_cases: "generated/work-package-1/extraction-review-cases.json",
  normalized_xlsx: "generated/work-package-1/normalized-data.xlsx",
  pdf_directory: "generated/work-package-1/pdfs",
  combined_pdf: "generated/work-package-1/pdfs/form3a-five-week-combined.pdf",
  ui_projection: "generated/work-package-1/ui-projection.json",
};

for (const sourcePath of Object.values(sources)) {
  if (!existsSync(sourcePath)) throw new Error(`Missing approved Gate 5 source: ${sourcePath}`);
}

const projection = validateGate4dUiProjection(
  JSON.parse(readFileSync(sources.ui_projection, "utf8")) as Gate4dUiProjection,
);
const brief = deriveSafetyReviewBrief(
  loadFieldCatalogue(),
  loadNormalizedData(),
  loadExtractionReviewData(),
  projection,
  sources,
);
const outputPath = resolve(process.env.GATE5_OUTPUT_PATH ?? SAFETY_REVIEW_BRIEF_PATH);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, serializeDeterministicJson(brief), "utf8");
