import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

type Evidence = {
  observation_id: string;
  report_id: string;
  page_number: number;
  item_id: string;
  inspection_date: string;
  rating: string | null;
  weekly_summary_id: string;
  weekly_dominant_rating: string | null;
  recommendation_id: string | null;
  source_reference: { display_reference: string };
  individual_pdf_reference: { artifact_path: string; page_number: number };
  combined_pdf_reference: { artifact_path: string; page_number: number };
};

type Finding = {
  finding_id: string;
  finding_type: string;
  title: string;
  verified_evidence: Evidence[];
  interpretation: string;
  suggested_action: string;
  safety_review_status: "Pending";
};

type SafetyReviewBrief = {
  sources: Record<string, string>;
  findings: Finding[];
  extraction_review: { separation_notice: string; cases: Array<{ case_id: string }> };
};

const OUTPUT_PATH = path.resolve("generated/work-package-1/safety-review-brief.json");
const GENERATOR_PATH = path.resolve("src/form3a/generate-gate5.ts");
const ANALYSIS_PATH = path.resolve("src/form3a/findings.ts");

describe("Gate 5 deterministic safety review findings", () => {
  it("declares the Gate 5 generator and committed brief", async () => {
    const packageJson = await loadJson<{ scripts?: Record<string, string> }>("package.json");

    expect(existsSync(GENERATOR_PATH), GENERATOR_PATH).toBe(true);
    expect(existsSync(ANALYSIS_PATH), ANALYSIS_PATH).toBe(true);
    expect(existsSync(OUTPUT_PATH), OUTPUT_PATH).toBe(true);
    expect(packageJson.scripts?.["generate:gate5"]).toBe(
      "node --import tsx src/form3a/generate-gate5.ts",
    );
  });

  it("matches the independent fixture finding expectations", async () => {
    if (!existsSync(OUTPUT_PATH)) return;
    const [brief, fixture] = await Promise.all([
      loadJson<SafetyReviewBrief>(OUTPUT_PATH),
      loadJson<{
        story_expectations: {
          required_finding_types: string[];
          intentional_ladder_inconsistency_count: number;
          expected_finding_references: Array<{
            finding_type: string;
            evidence: Array<{
              report_id: string;
              page_number: number;
              item_id: string;
              inspection_date: string;
              recommendation_entry_id?: string;
            }>;
          }>;
        };
      }>("data/form3a/canonical-five-week-fixture.json"),
    ]);

    expect(brief.findings.map((finding) => finding.finding_type)).toEqual(
      fixture.story_expectations.required_finding_types,
    );
    for (const expectation of fixture.story_expectations.expected_finding_references) {
      const finding = brief.findings.find(
        (entry) => entry.finding_type === expectation.finding_type,
      )!;
      expect(
        finding.verified_evidence.map((evidence) => ({
          report_id: evidence.report_id,
          page_number: evidence.page_number,
          item_id: evidence.item_id,
          inspection_date: evidence.inspection_date,
          display_reference: evidence.source_reference.display_reference,
          ...(evidence.recommendation_id === null
            ? {}
            : { recommendation_entry_id: evidence.recommendation_id }),
        })),
      ).toEqual(expectation.evidence);
    }
    expect(
      brief.findings.filter(
        (finding) => finding.finding_type === "rating_recommendation_inconsistency",
      ),
    ).toHaveLength(fixture.story_expectations.intentional_ladder_inconsistency_count);
  });

  it("keeps ratings unchanged and resolves every evidence and PDF reference", async () => {
    if (!existsSync(OUTPUT_PATH)) return;
    const [brief, normalized, projection] = await Promise.all([
      loadJson<SafetyReviewBrief>(OUTPUT_PATH),
      loadJson<{
        observations: Array<{ observation_id: string; rating: string | null }>;
        weekly_summaries: Array<{ summary_id: string; weekly_dominant_rating: string | null }>;
      }>("generated/work-package-1/normalized-data.json"),
      loadJson<{
        reports: Array<{
          pages: Array<{
            page_id: string;
            individual_pdf_reference: Evidence["individual_pdf_reference"];
            combined_pdf_reference: Evidence["combined_pdf_reference"];
          }>;
        }>;
      }>("generated/work-package-1/ui-projection.json"),
    ]);
    const observations = new Map(
      normalized.observations.map((entry) => [entry.observation_id, entry]),
    );
    const summaries = new Map(
      normalized.weekly_summaries.map((entry) => [entry.summary_id, entry]),
    );
    const pages = new Map(
      projection.reports.flatMap((report) =>
        report.pages.map((page) => [page.page_id, page] as const),
      ),
    );

    for (const finding of brief.findings) {
      expect(finding.safety_review_status).toBe("Pending");
      expect(finding.verified_evidence.length).toBeGreaterThan(0);
      for (const evidence of finding.verified_evidence) {
        expect(observations.get(evidence.observation_id)?.rating).toBe(evidence.rating);
        expect(summaries.get(evidence.weekly_summary_id)?.weekly_dominant_rating).toBe(
          evidence.weekly_dominant_rating,
        );
        const page = pages.get(`${evidence.report_id}:page:${evidence.page_number}`)!;
        expect(evidence.individual_pdf_reference).toEqual(page.individual_pdf_reference);
        expect(evidence.combined_pdf_reference).toEqual(page.combined_pdf_reference);
        expect(existsSync(evidence.individual_pdf_reference.artifact_path)).toBe(true);
        expect(existsSync(evidence.combined_pdf_reference.artifact_path)).toBe(true);
      }
    }

    const sequence = brief.findings
      .find((finding) => finding.finding_type === "improved_then_recurred")!
      .verified_evidence.map((evidence) => evidence.weekly_dominant_rating);
    expect(sequence).toEqual(["P", "S", "P"]);

    const inconsistency = brief.findings.find(
      (finding) => finding.finding_type === "rating_recommendation_inconsistency",
    )!;
    expect(inconsistency.verified_evidence[0]?.rating).toBe("G");
    expect(inconsistency.verified_evidence[0]?.recommendation_id).toBe("F3A-R02-REC-02");

    const poorWithoutRecommendation = brief.findings.find(
      (finding) => finding.finding_type === "poor_without_recommendation",
    )!;
    expect(poorWithoutRecommendation.verified_evidence[0]).toMatchObject({
      item_id: "general_housekeeping",
      rating: "P",
      recommendation_id: null,
    });
  });

  it("keeps extraction review separate and excludes prohibited claims", async () => {
    if (!existsSync(OUTPUT_PATH)) return;
    const [brief, extractionReview] = await Promise.all([
      loadJson<SafetyReviewBrief>(OUTPUT_PATH),
      loadJson<{ cases: Array<{ case_id: string }> }>(
        "generated/work-package-1/extraction-review-cases.json",
      ),
    ]);

    expect(brief.extraction_review.cases).toEqual(extractionReview.cases);
    expect(brief.extraction_review.separation_notice).toMatch(/separate/i);
    const findingsOnly = JSON.stringify(brief.findings);
    for (const reviewCase of extractionReview.cases) {
      expect(findingsOnly).not.toContain(reviewCase.case_id);
    }
    expect(findingsOnly).not.toMatch(
      /weather|safety.?alert|legal|compliance|audit conclusion|accident causation|caused by|ocr/i,
    );
    expect(findingsOnly).not.toMatch(/"remarks?"\s*:/i);
    expect(findingsOnly).not.toMatch(/"safety_review_status"\s*:\s*"(?!Pending")/i);
  });

  it("does not use the fixture expectation oracle in production analysis", async () => {
    if (!existsSync(ANALYSIS_PATH)) return;
    const source = await fs.readFile(ANALYSIS_PATH, "utf8");
    expect(source).not.toMatch(/story_expectations|expected_finding_references/);
    expect(source).not.toMatch(/canonical-five-week-fixture/);
  });

  it("regenerates deterministically", async () => {
    if (!existsSync(GENERATOR_PATH)) return;
    const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "gate5-"));
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
    env: { ...process.env, GATE5_OUTPUT_PATH: outputPath },
    encoding: "utf8",
  });
  expect(result.status, result.stderr).toBe(0);
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
