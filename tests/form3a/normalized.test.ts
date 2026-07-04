import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { loadFieldCatalogue } from "../../src/form3a/catalogue.js";
import { loadCanonicalFixture } from "../../src/form3a/fixture.js";
import {
  EXTRACTION_REVIEW_CASES_PATH,
  NORMALIZED_DATA_PATH,
  generateGate4aData,
  serializeDeterministicJson,
  validateExtractionReviewData,
  validateNormalizedData,
} from "../../src/form3a/normalized.js";

describe("Gate 4A normalized JSON", () => {
  it("creates one deterministically ordered observation per report, item, and day", () => {
    const fixture = loadCanonicalFixture();
    const catalogue = loadFieldCatalogue();
    const { normalizedData } = generateGate4aData(fixture, catalogue);

    expect(normalizedData.observations).toHaveLength(2_275);
    expect(normalizedData.observations[0]).toEqual(
      expect.objectContaining({
        observation_id: "F3A-R01:access_and_egress_gangways:2026-05-31",
        report_id: "F3A-R01",
        item_id: "access_and_egress_gangways",
        inspection_date: "2026-05-31",
        weekday: "Sunday",
        rating: "N/A",
      }),
    );
    expect(normalizedData.observations.at(-1)).toEqual(
      expect.objectContaining({
        observation_id: "F3A-R05:ppe_others:2026-07-04",
        report_id: "F3A-R05",
        item_id: "ppe_others",
        inspection_date: "2026-07-04",
        weekday: "Saturday",
      }),
    );

    const fixtureValues = fixture.reports.flatMap((report) =>
      catalogue.sections.flatMap((section) =>
        section.items.flatMap((item) =>
          report.item_ratings.find((entry) => entry.item_id === item.item_id)!.daily_values,
        ),
      ),
    );
    expect(normalizedData.observations.map((observation) => observation.rating)).toEqual(
      fixtureValues,
    );
  });

  it("uses resolvable source references and fixture-derived recommendations", () => {
    const fixture = loadCanonicalFixture();
    const catalogue = loadFieldCatalogue();
    const { normalizedData } = generateGate4aData(fixture, catalogue);
    const itemIds = new Set(
      catalogue.sections.flatMap((section) => section.items.map((item) => item.item_id)),
    );
    const observationIds = new Set(
      normalizedData.observations.map((observation) => observation.observation_id),
    );

    normalizedData.observations.forEach((observation) => {
      expect(itemIds.has(observation.item_id)).toBe(true);
      expect(observation.source_reference.report_id).toBe(observation.report_id);
      expect(observation.source_reference.item_id).toBe(observation.item_id);
      expect(observation.source_reference.inspection_date).toBe(observation.inspection_date);
      expect(observation.source_reference.display_reference).toContain(observation.report_id);
    });

    const fixtureRecommendations = fixture.reports.flatMap((report) =>
      report.recommendations.map((entry) => [entry.recommendation_id, entry.recommendation]),
    );
    expect(
      normalizedData.recommendations.map((entry) => [
        entry.recommendation_id,
        entry.recommendation,
      ]),
    ).toEqual(fixtureRecommendations);
    normalizedData.recommendations.forEach((entry) => {
      entry.linked_observation_ids.forEach((id) => expect(observationIds.has(id)).toBe(true));
    });
  });

  it("derives complete GSP weekly counts and the scaffold sequence", () => {
    const { normalizedData } = generateGate4aData(
      loadCanonicalFixture(),
      loadFieldCatalogue(),
    );

    expect(normalizedData.weekly_summaries).toHaveLength(325);
    const scaffolds = normalizedData.weekly_summaries.filter(
      (summary) => summary.item_id === "working_at_height_scaffolds",
    );
    expect(scaffolds.map((summary) => summary.weekly_dominant_rating)).toEqual([
      "S",
      "P",
      "P",
      "S",
      "P",
    ]);
    expect(scaffolds[1]).toEqual(
      expect.objectContaining({
        rating_type: "GSP",
        g_count: 0,
        s_count: 3,
        p_count: 3,
        na_count: 1,
        blank_count: 0,
        applicable_day_count: 6,
        weekly_dominant_rating: "P",
        tie_break_applied: true,
      }),
    );

    const washingFacilities = normalizedData.weekly_summaries.find(
      (summary) =>
        summary.report_id === "F3A-R01" && summary.item_id === "health_washing_facilities",
    );
    expect(washingFacilities).toEqual(
      expect.objectContaining({
        rating_type: "GSP",
        g_count: 5,
        na_count: 1,
        blank_count: 1,
        applicable_day_count: 5,
      }),
    );
  });

  it("summarizes YES/NO without inventing GSP dominance", () => {
    const { normalizedData } = generateGate4aData(
      loadCanonicalFixture(),
      loadFieldCatalogue(),
    );
    const notice = normalizedData.weekly_summaries.find(
      (summary) =>
        summary.report_id === "F3A-R01" &&
        summary.item_id === "general_notice_of_employment",
    );

    expect(notice).toEqual(
      expect.objectContaining({
        rating_type: "YES_NO",
        yes_count: 6,
        no_count: 0,
        na_count: 1,
        blank_count: 0,
        applicable_day_count: 6,
        weekly_dominant_rating: null,
      }),
    );
    expect(notice).not.toHaveProperty("g_count");
    expect(notice).not.toHaveProperty("s_count");
    expect(notice).not.toHaveProperty("p_count");
  });

  it("derives extraction review cases without OCR confidence", () => {
    const fixture = loadCanonicalFixture();
    const { extractionReviewData } = generateGate4aData(fixture, loadFieldCatalogue());

    expect(extractionReviewData.cases).toEqual(fixture.extraction_review_annotations);
    expect(extractionReviewData.cases).toHaveLength(3);
    expect(JSON.stringify(extractionReviewData)).not.toMatch(/ocr.?confidence/i);
    expect(() => validateExtractionReviewData(extractionReviewData)).not.toThrow();
  });

  it("matches committed artifacts and regenerates byte-for-byte deterministically", () => {
    const output = generateGate4aData(loadCanonicalFixture(), loadFieldCatalogue());
    const normalizedText = serializeDeterministicJson(output.normalizedData);
    const extractionText = serializeDeterministicJson(output.extractionReviewData);

    expect(normalizedText).toBe(serializeDeterministicJson(output.normalizedData));
    expect(extractionText).toBe(serializeDeterministicJson(output.extractionReviewData));
    expect(readFileSync(NORMALIZED_DATA_PATH, "utf8")).toBe(normalizedText);
    expect(readFileSync(EXTRACTION_REVIEW_CASES_PATH, "utf8")).toBe(extractionText);
    expect(() => validateNormalizedData(JSON.parse(normalizedText))).not.toThrow();
  });

  it("contains deterministic metadata and no prohibited fields", () => {
    const output = generateGate4aData(loadCanonicalFixture(), loadFieldCatalogue());
    const serialized = JSON.stringify(output);

    expect(output.normalizedData).toEqual(
      expect.objectContaining({
        schema_version: "1.0.0",
        fixture_version: "1.0.0",
        source_fixture: "data/form3a/canonical-five-week-fixture.json",
      }),
    );
    expect(serialized).not.toMatch(/generated_at|timestamp/i);
    expect(serialized).not.toMatch(/"remarks?"\s*:/i);
    expect(serialized).not.toContain("rating_remarks_inconsistency");
    expect(serialized).not.toContain("safety_review_status");
  });
});
