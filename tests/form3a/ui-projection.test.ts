import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import type { FieldCatalogue } from "../../src/form3a/contracts.js";
import type { CanonicalFixture } from "../../src/form3a/fixture-contracts.js";
import type {
  ExtractionReviewData,
  NormalizedData,
} from "../../src/form3a/normalized-contracts.js";
import type { Gate4dUiProjection } from "../../src/form3a/ui-projection.js";

const OUTPUT_PATH = path.resolve("generated/work-package-1/ui-projection.json");
const GENERATOR_PATH = path.resolve("src/form3a/generate-gate4d.ts");
const REPORT_IDS = ["F3A-R01", "F3A-R02", "F3A-R03", "F3A-R04", "F3A-R05"];

describe("Gate 4D UI data projection", () => {
  it("declares the deterministic generator and output", async () => {
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(existsSync(GENERATOR_PATH)).toBe(true);
    expect(existsSync(OUTPUT_PATH)).toBe(true);
    expect(packageJson.scripts?.["generate:gate4d"]).toBe(
      "node --import tsx src/form3a/generate-gate4d.ts",
    );
  });

  it("exposes five reports with four ordered single-page PDF references", async () => {
    expect(existsSync(OUTPUT_PATH), OUTPUT_PATH).toBe(true);
    if (!existsSync(OUTPUT_PATH)) return;
    const projection = await loadJson<Gate4dUiProjection>(OUTPUT_PATH);

    expect(projection.report_order).toEqual(REPORT_IDS);
    expect(projection.navigation).toEqual({
      default_report_id: "F3A-R01",
      default_page_id: "F3A-R01:page:1",
      preview_mode: "single_page",
    });
    expect(projection.reports).toHaveLength(5);
    projection.reports.forEach((report, reportIndex) => {
      expect(report.report_id).toBe(REPORT_IDS[reportIndex]);
      expect(report.pages).toHaveLength(4);
      report.pages.forEach((page, pageIndex) => {
        const pageNumber = pageIndex + 1;
        expect(page.page_id).toBe(`${report.report_id}:page:${pageNumber}`);
        expect(page.page_indicator).toBe(`${pageNumber} / 4`);
        expect(page.previous_page_id).toBe(
          pageNumber === 1 ? null : `${report.report_id}:page:${pageNumber - 1}`,
        );
        expect(page.next_page_id).toBe(
          pageNumber === 4 ? null : `${report.report_id}:page:${pageNumber + 1}`,
        );
        expect(page.individual_pdf_reference).toEqual({
          artifact_path: `generated/work-package-1/pdfs/${report.report_id}.pdf`,
          page_number: pageNumber,
        });
        expect(page.combined_pdf_reference).toEqual({
          artifact_path: "generated/work-package-1/pdfs/form3a-five-week-combined.pdf",
          page_number: reportIndex * 4 + pageNumber,
        });
        expect(existsSync(page.individual_pdf_reference.artifact_path)).toBe(true);
        expect(existsSync(page.combined_pdf_reference.artifact_path)).toBe(true);
      });
    });
  });

  it("preserves canonical IDs, source traceability, and report-level record parity", async () => {
    expect(existsSync(OUTPUT_PATH), OUTPUT_PATH).toBe(true);
    if (!existsSync(OUTPUT_PATH)) return;
    const [projection, fixture, catalogue, normalized, extractionReview] = await Promise.all([
      loadJson<Gate4dUiProjection>(OUTPUT_PATH),
      loadJson<CanonicalFixture>("data/form3a/canonical-five-week-fixture.json"),
      loadJson<FieldCatalogue>("data/form3a/field-catalogue.json"),
      loadJson<NormalizedData>("generated/work-package-1/normalized-data.json"),
      loadJson<ExtractionReviewData>("generated/work-package-1/extraction-review-cases.json"),
    ]);

    expect(projection.catalogue).toEqual({
      catalogue_version: catalogue.catalogue_version,
      source: catalogue.source,
      sections: catalogue.sections,
      document_fields: catalogue.document_fields,
    });
    projection.reports.forEach((report) => {
      const fixtureReport = fixture.reports.find((entry) => entry.report_id === report.report_id)!;
      expect(report.metadata).toEqual({
        week_start_date: fixtureReport.week_start_date,
        week_end_date: fixtureReport.week_end_date,
        number_of_workers: fixtureReport.number_of_workers,
        project: fixture.project_metadata,
        company: fixture.company_metadata,
        personnel: fixture.personnel_metadata,
      });
      expect(report.observations).toEqual(
        normalized.observations.filter((entry) => entry.report_id === report.report_id),
      );
      expect(report.weekly_summaries).toEqual(
        normalized.weekly_summaries.filter((entry) => entry.report_id === report.report_id),
      );
      expect(report.recommendations).toEqual(
        normalized.recommendations.filter((entry) => entry.report_id === report.report_id),
      );
      expect(report.extraction_review_queue).toEqual(
        extractionReview.cases.filter(
          (entry) => entry.source_reference.report_id === report.report_id,
        ),
      );

      expect(report.pages.flatMap((page) => page.observation_ids)).toEqual(
        report.observations.map((entry) => entry.observation_id),
      );
      expect(report.pages.flatMap((page) => page.summary_ids)).toEqual(
        report.weekly_summaries.map((entry) => entry.summary_id),
      );
      expect(report.pages.flatMap((page) => page.recommendation_ids)).toEqual(
        report.recommendations.map((entry) => entry.recommendation_id),
      );
      expect(report.pages.flatMap((page) => page.extraction_review_case_ids)).toEqual(
        report.extraction_review_queue.map((entry) => entry.case_id),
      );
    });
  });

  it("contains only approved paths and no finding or frontend implementation fields", async () => {
    expect(existsSync(OUTPUT_PATH), OUTPUT_PATH).toBe(true);
    if (!existsSync(OUTPUT_PATH)) return;
    const projection = await loadJson<Gate4dUiProjection>(OUTPUT_PATH);
    expect(projection.sources).toEqual({
      canonical_fixture: "data/form3a/canonical-five-week-fixture.json",
      field_catalogue: "data/form3a/field-catalogue.json",
      normalized_data: "generated/work-package-1/normalized-data.json",
      extraction_review_cases: "generated/work-package-1/extraction-review-cases.json",
      normalized_xlsx: "generated/work-package-1/normalized-data.xlsx",
      individual_pdf_directory: "generated/work-package-1/pdfs",
      combined_pdf: "generated/work-package-1/pdfs/form3a-five-week-combined.pdf",
    });

    const serialized = JSON.stringify(projection);
    expect(serialized).not.toMatch(/"remarks?"\s*:/i);
    expect(serialized).not.toMatch(/"(?:findings?|manifest|ocr|weather|safety_alert|components?|screens?)"\s*:/i);
  });

  it("serializes deterministically", async () => {
    expect(existsSync(GENERATOR_PATH), GENERATOR_PATH).toBe(true);
    if (!existsSync(GENERATOR_PATH)) return;
    const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "gate4d-"));
    const first = path.join(temporaryDirectory, "first.json");
    const second = path.join(temporaryDirectory, "second.json");

    try {
      runGenerator(first);
      runGenerator(second);
      expect(sha256(await fs.readFile(second))).toBe(sha256(await fs.readFile(first)));
    } finally {
      await fs.rm(temporaryDirectory, { recursive: true, force: true });
    }
  });
});

async function loadJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function runGenerator(outputPath: string): void {
  const result = spawnSync(process.execPath, ["--import", "tsx", GENERATOR_PATH], {
    cwd: process.cwd(),
    env: { ...process.env, GATE4D_OUTPUT_PATH: outputPath },
    encoding: "utf8",
  });
  expect(result.status, result.stderr).toBe(0);
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
