import fs from "node:fs/promises";

import ExcelJS from "exceljs";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { loadFieldCatalogue } from "../../src/form3a/catalogue.js";
import { loadCanonicalFixture } from "../../src/form3a/fixture.js";
import { loadNormalizedData } from "../../src/form3a/normalized.js";
import {
  NORMALIZED_XLSX_PATH,
  deriveGate4bWorkbookData,
} from "../../src/form3a/xlsx-data.js";

const EXPECTED_SHEETS = [
  "Reports",
  "Observations",
  "Recommendations",
  "Extraction Review",
  "Weekly Summaries",
  "Expected Findings",
  "Field Catalogue",
] as const;

describe("Gate 4B normalized XLSX", () => {
  it("derives the seven required sheets with stable row counts", () => {
    const workbookData = deriveGate4bWorkbookData(
      loadCanonicalFixture(),
      loadNormalizedData(),
      loadFieldCatalogue(),
    );

    expect(workbookData.map((sheet) => sheet.name)).toEqual(EXPECTED_SHEETS);
    expect(Object.fromEntries(workbookData.map((sheet) => [sheet.name, sheet.rows.length]))).toEqual({
      Reports: 5,
      Observations: 2_275,
      Recommendations: 8,
      "Extraction Review": 3,
      "Weekly Summaries": 325,
      "Expected Findings": 5,
      "Field Catalogue": 79,
    });
    workbookData.forEach((sheet) => {
      expect(sheet.headers.some((header) => /^remarks?$/i.test(header))).toBe(false);
      expect(sheet.rows.every((row) => row.length === sheet.headers.length)).toBe(true);
    });
  });

  it("preserves normalized observation semantics and typed dates", () => {
    const normalizedData = loadNormalizedData();
    const observations = deriveGate4bWorkbookData(
      loadCanonicalFixture(),
      normalizedData,
      loadFieldCatalogue(),
    ).find((sheet) => sheet.name === "Observations")!;
    const headerIndex = new Map(observations.headers.map((header, index) => [header, index]));

    expect(observations.dateColumns).toEqual([
      "report_start_date",
      "report_end_date",
      "inspection_date",
    ]);
    expect(
      observations.rows.map((row) => row[headerIndex.get("observation_id")!]),
    ).toEqual(normalizedData.observations.map((entry) => entry.observation_id));
    expect(observations.rows[0]![headerIndex.get("rating")!]).toBe("N/A");
    expect(observations.rows[0]![headerIndex.get("inspection_date")!]).toBeInstanceOf(Date);
    expect(observations.rows.at(-1)![headerIndex.get("observation_id")!]).toBe(
      "F3A-R05:ppe_others:2026-07-04",
    );
  });

  it("preserves weekly-summary and recommendation parity", () => {
    const normalizedData = loadNormalizedData();
    const workbookData = deriveGate4bWorkbookData(
      loadCanonicalFixture(),
      normalizedData,
      loadFieldCatalogue(),
    );
    const summaries = workbookData.find((sheet) => sheet.name === "Weekly Summaries")!;
    const summaryIndex = new Map(summaries.headers.map((header, index) => [header, index]));
    const recommendations = workbookData.find((sheet) => sheet.name === "Recommendations")!;
    const recommendationIndex = new Map(
      recommendations.headers.map((header, index) => [header, index]),
    );

    expect(summaries.rows.map((row) => row[summaryIndex.get("summary_id")!])).toEqual(
      normalizedData.weekly_summaries.map((entry) => entry.summary_id),
    );
    expect(
      recommendations.rows.map((row) => row[recommendationIndex.get("recommendation_id")!]),
    ).toEqual(normalizedData.recommendations.map((entry) => entry.recommendation_id));

    const r02Scaffold = summaries.rows.find(
      (row) => row[summaryIndex.get("summary_id")!] === "F3A-R02:working_at_height_scaffolds:weekly",
    )!;
    expect(r02Scaffold[summaryIndex.get("p_count")!]).toBe(3);
    expect(r02Scaffold[summaryIndex.get("s_count")!]).toBe(3);
    expect(r02Scaffold[summaryIndex.get("weekly_dominant_rating")!]).toBe("P");
  });

  it("labels expected-finding rows as expectations rather than generated findings", () => {
    const expectedFindings = deriveGate4bWorkbookData(
      loadCanonicalFixture(),
      loadNormalizedData(),
      loadFieldCatalogue(),
    ).find((sheet) => sheet.name === "Expected Findings")!;
    const typeIndex = expectedFindings.headers.indexOf("record_type");

    expect(expectedFindings.rows).toHaveLength(5);
    expect(expectedFindings.rows.every((row) => row[typeIndex] === "EXPECTATION_ONLY")).toBe(true);
    expect(expectedFindings.headers).not.toContain("finding_id");
    expect(expectedFindings.headers).not.toContain("safety_review_status");
  });

  it("exports the required workbook sheets, headers, filters, and data rows", async () => {
    const workbookData = deriveGate4bWorkbookData(
      loadCanonicalFixture(),
      loadNormalizedData(),
      loadFieldCatalogue(),
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(NORMALIZED_XLSX_PATH);

    EXPECTED_SHEETS.forEach((name, index) => {
      const sheet = workbook.worksheets[index]!;
      expect(sheet.name).toBe(name);
      const expected = workbookData[index]!;
      const headerValues = sheet.getRow(1).values;
      expect(Array.isArray(headerValues) ? headerValues.slice(1) : []).toEqual(expected.headers);
      expect(sheet.rowCount).toBe(expected.rows.length + 1);
      expect(sheet.getTable(`Gate4BTable${index + 1}`).headerRow).toBe(true);
    });

    const reports = workbook.getWorksheet("Reports")!;
    expect(reports.getCell("B2").value).toBeInstanceOf(Date);
    expect(reports.getCell("B2").numFmt).toBe("yyyy-mm-dd");
  });

  it("persists a frozen first row in every worksheet XML", async () => {
    const archive = unzipSync(new Uint8Array(await fs.readFile(NORMALIZED_XLSX_PATH)));
    const worksheetPaths = Object.keys(archive)
      .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
      .sort((left, right) => worksheetNumber(left) - worksheetNumber(right));

    expect(worksheetPaths).toHaveLength(EXPECTED_SHEETS.length);
    worksheetPaths.forEach((worksheetPath) => {
      const xml = strFromU8(archive[worksheetPath]!);
      expect(xml, worksheetPath).toContain('ySplit="1"');
      expect(xml, worksheetPath).toContain('topLeftCell="A2"');
      expect(xml, worksheetPath).toContain('state="frozen"');
    });
  });

  it("uses only declared dependencies for Gate 4B XLSX generation", async () => {
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const generator = await fs.readFile("scripts/generate-gate4b.mjs", "utf8");

    expect(packageJson.dependencies?.exceljs).toBe("4.4.0");
    expect(packageJson.devDependencies?.fflate).toBe("0.8.2");
    expect(generator).not.toContain("@oai/artifact-tool");
  });

  it("keeps workbook semantics deterministic", () => {
    const inputs = [loadCanonicalFixture(), loadNormalizedData(), loadFieldCatalogue()] as const;
    const first = deriveGate4bWorkbookData(...inputs);
    const second = deriveGate4bWorkbookData(...inputs);

    expect(second).toEqual(first);
  });
});

function worksheetNumber(path: string): number {
  return Number(path.match(/sheet(\d+)\.xml$/)?.[1]);
}
