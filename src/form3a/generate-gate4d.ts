import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { loadFieldCatalogue } from "./catalogue.js";
import { loadCanonicalFixture } from "./fixture.js";
import {
  loadExtractionReviewData,
  loadNormalizedData,
  serializeDeterministicJson,
} from "./normalized.js";
import {
  deriveGate4dUiProjection,
  GATE4D_SOURCES,
  UI_PROJECTION_PATH,
} from "./ui-projection.js";

const outputPath = resolve(process.env.GATE4D_OUTPUT_PATH ?? UI_PROJECTION_PATH);

for (const artifactPath of [
  GATE4D_SOURCES.normalized_xlsx,
  GATE4D_SOURCES.combined_pdf,
  ...loadCanonicalFixture().reports.map(
    (report) => `${GATE4D_SOURCES.individual_pdf_directory}/${report.report_id}.pdf`,
  ),
]) {
  if (!existsSync(artifactPath)) throw new Error(`Missing approved artifact: ${artifactPath}`);
}

const projection = deriveGate4dUiProjection(
  loadCanonicalFixture(),
  loadFieldCatalogue(),
  loadNormalizedData(),
  loadExtractionReviewData(),
);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, serializeDeterministicJson(projection), "utf8");
