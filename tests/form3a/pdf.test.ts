import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";

const REPORT_IDS = ["F3A-R01", "F3A-R02", "F3A-R03", "F3A-R04", "F3A-R05"];
const OUTPUT_DIR = path.resolve("generated/work-package-1/pdfs");
const COMBINED_PATH = path.join(OUTPUT_DIR, "form3a-five-week-combined.pdf");
const GENERATOR_PATH = path.resolve("src/form3a/generate-gate4c.ts");
const RENDERING_DECISION_PATH = path.resolve("docs/gate-4c-rendering.md");

describe("Gate 4C Form 3A PDFs", () => {
  it("declares the generator, rendering decision, and reproducible PDF dependencies", async () => {
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf8")) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(existsSync(GENERATOR_PATH)).toBe(true);
    expect(existsSync(RENDERING_DECISION_PATH)).toBe(true);
    expect(packageJson.scripts?.["generate:gate4c"]).toBe(
      "node --import tsx src/form3a/generate-gate4c.ts",
    );
    expect(packageJson.dependencies?.pdfkit).toBe("0.19.1");
    expect(packageJson.dependencies?.["@fontsource/noto-sans-hk"]).toBe("5.2.9");
    expect(packageJson.devDependencies?.["pdfjs-dist"]).toBe("5.4.624");
  });

  it("generates five four-page reports and one twenty-page combined PDF", async () => {
    for (const reportId of REPORT_IDS) {
      const filePath = path.join(OUTPUT_DIR, `${reportId}.pdf`);
      expect(existsSync(filePath), filePath).toBe(true);
      if (!existsSync(filePath)) continue;
      const pdf = await loadPdf(filePath);
      expect(pdf.numPages, reportId).toBe(4);
    }

    expect(existsSync(COMBINED_PATH), COMBINED_PATH).toBe(true);
    if (!existsSync(COMBINED_PATH)) return;
    const combined = await loadPdf(COMBINED_PATH);
    expect(combined.numPages).toBe(20);
  });

  it("preserves the bilingual four-page structure, source values, recommendations, and signatures", async () => {
    const fixture = JSON.parse(
      await fs.readFile("data/form3a/canonical-five-week-fixture.json", "utf8"),
    ) as {
      synthetic_data_notice: string;
      reports: Array<{
        report_id: string;
        item_ratings: Array<{ daily_values: Array<string | null> }>;
        recommendations: Array<{ recommendation: string }>;
        signatures: Record<string, { value: string | null }>;
      }>;
    };
    const catalogue = JSON.parse(await fs.readFile("data/form3a/field-catalogue.json", "utf8")) as {
      sections: Array<{
        page_number: number;
        label_en: string;
        label_zh: string;
        items: Array<{ label_en: string; label_zh: string }>;
      }>;
    };

    for (const report of fixture.reports) {
      const filePath = path.join(OUTPUT_DIR, `${report.report_id}.pdf`);
      expect(existsSync(filePath), filePath).toBe(true);
      if (!existsSync(filePath)) continue;
      const pdf = await loadPdf(filePath);
      const pages = await extractPages(pdf);
      const pageItems = await extractPageItems(pdf);

      pages.forEach((text, index) => {
        expect(text).toContain(report.report_id);
        expect(text).toContain(`Page ${index + 1} of 4`);
        expect(text).toContain(fixture.synthetic_data_notice);
        catalogue.sections
          .filter((section) => section.page_number === index + 1)
          .forEach((section) => {
            expect(text).toContain(section.label_en);
            expect(text).toContain(section.label_zh);
            section.items.forEach((item) => {
              expect(text).toContain(item.label_en);
              expect(text).toContain(item.label_zh);
            });
          });
      });
      const documentText = pages.join(" ");
      report.recommendations.forEach(({ recommendation }) => {
        expect(documentText).toContain(recommendation);
      });
      Object.values(report.signatures)
        .map(({ value }) => value)
        .filter((value): value is string => value !== null)
        .forEach((value) => expect(documentText).toContain(value));

      const expectedRatingCounts = countValues(
        report.item_ratings.flatMap(({ daily_values }) => daily_values).filter(isRating),
      );
      const actualRatingCounts = countValues(pageItems.flat().filter(isRating));
      expect(actualRatingCounts).toEqual(expectedRatingCounts);
    }
  });

  it("keeps the combined PDF in report and page order", async () => {
    expect(existsSync(COMBINED_PATH), COMBINED_PATH).toBe(true);
    if (!existsSync(COMBINED_PATH)) return;
    const combined = await loadPdf(COMBINED_PATH);
    const pages = await extractPages(combined);

    REPORT_IDS.forEach((reportId, reportIndex) => {
      pages.slice(reportIndex * 4, reportIndex * 4 + 4).forEach((text, pageIndex) => {
        expect(text).toContain(reportId);
        expect(text).toContain(`Page ${pageIndex + 1} of 4`);
      });
    });
  });

  it("produces deterministic PDF bytes from fixed inputs", async () => {
    expect(existsSync(GENERATOR_PATH), GENERATOR_PATH).toBe(true);
    if (!existsSync(GENERATOR_PATH)) return;
    const first = await fs.mkdtemp(path.join(os.tmpdir(), "gate4c-first-"));
    const second = await fs.mkdtemp(path.join(os.tmpdir(), "gate4c-second-"));

    try {
      runGenerator(first);
      runGenerator(second);
      const names = [...REPORT_IDS.map((reportId) => `${reportId}.pdf`), path.basename(COMBINED_PATH)];
      for (const name of names) {
        const firstHash = sha256(await fs.readFile(path.join(first, name)));
        const secondHash = sha256(await fs.readFile(path.join(second, name)));
        expect(secondHash, name).toBe(firstHash);
      }
    } finally {
      await fs.rm(first, { recursive: true, force: true });
      await fs.rm(second, { recursive: true, force: true });
    }
  }, 15_000);
});

async function loadPdf(filePath: string) {
  const bytes = new Uint8Array(await fs.readFile(filePath));
  return getDocument({ data: bytes, useSystemFonts: false }).promise;
}

async function extractPages(pdf: Awaited<ReturnType<typeof loadPdf>>): Promise<string[]> {
  const pageItems = await extractPageItems(pdf);
  return pageItems.map((items) => items.join("").replaceAll(/\s+/g, " ").trim());
}

async function extractPageItems(pdf: Awaited<ReturnType<typeof loadPdf>>): Promise<string[][]> {
  const pages: string[][] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")));
  }
  return pages;
}

function runGenerator(outputDir: string): void {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", GENERATOR_PATH],
    {
      cwd: process.cwd(),
      env: { ...process.env, GATE4C_OUTPUT_DIR: outputDir },
      encoding: "utf8",
    },
  );
  expect(result.status, result.stderr).toBe(0);
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function isRating(value: string | null): value is string {
  return value !== null && ["G", "S", "P", "YES", "NO", "N/A"].includes(value);
}

function countValues(values: string[]): Record<string, number> {
  return Object.fromEntries(
    ["G", "S", "P", "YES", "NO", "N/A"].map((value) => [
      value,
      values.filter((entry) => entry === value).length,
    ]),
  );
}
