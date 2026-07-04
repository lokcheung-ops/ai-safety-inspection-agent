import { describe, expect, it } from "vitest";

import { loadFieldCatalogue } from "../../src/form3a/catalogue.js";
import {
  calculateWeeklyRatingSummary,
  loadCanonicalFixture,
  validateCanonicalFixture,
} from "../../src/form3a/fixture.js";

const EXPECTED_PERIODS = [
  ["2026-05-31", "2026-06-06"],
  ["2026-06-07", "2026-06-13"],
  ["2026-06-14", "2026-06-20"],
  ["2026-06-21", "2026-06-27"],
  ["2026-06-28", "2026-07-04"],
] as const;

const EXPECTED_FINDING_TYPES = [
  "repeated_or_worsening_rating",
  "improved_then_recurred",
  "rating_recommendation_inconsistency",
  "poor_without_recommendation",
  "missing_follow_up_evidence",
] as const;

const EXPECTED_SCAFFOLD_DAILY_VALUES = [
  ["N/A", "G", "S", "S", "S", "G", "S"],
  ["N/A", "P", "P", "P", "S", "S", "S"],
  ["N/A", "P", "P", "P", "P", "S", "S"],
  ["N/A", "S", "S", "S", "S", "G", "G"],
  ["N/A", "P", "P", "P", "S", "S", "G"],
] as const;

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

describe("canonical five-week Form 3A fixture", () => {
  it("contains exactly five consecutive Sunday-to-Saturday reports", () => {
    const fixture = loadCanonicalFixture();

    expect(fixture.reports.map((report) => [report.week_start_date, report.week_end_date])).toEqual(
      EXPECTED_PERIODS,
    );
    fixture.reports.forEach((report, index) => {
      expect(new Date(`${report.week_start_date}T00:00:00Z`).getUTCDay()).toBe(0);
      expect(new Date(`${report.week_end_date}T00:00:00Z`).getUTCDay()).toBe(6);
      expect(report.week_end_date).toBe(addDays(report.week_start_date, 6));
      if (index > 0) {
        expect(report.week_start_date).toBe(addDays(fixture.reports[index - 1]!.week_end_date, 1));
      }
      expect(report.page_count).toBe(4);
    });
  });

  it("stores seven daily values for every official item with valid rating vocabularies", () => {
    const catalogue = loadFieldCatalogue();
    const fixture = loadCanonicalFixture();
    const catalogueItems = catalogue.sections.flatMap((section) => section.items);
    const expectedIds = catalogueItems.map((item) => item.item_id).sort();

    fixture.reports.forEach((report) => {
      expect(report.item_ratings).toHaveLength(65);
      expect(report.item_ratings.map((entry) => entry.item_id).sort()).toEqual(expectedIds);

      for (const entry of report.item_ratings) {
        expect(entry.daily_values).toHaveLength(7);
        const catalogueItem = catalogueItems.find((item) => item.item_id === entry.item_id)!;
        const allowed =
          catalogueItem.rating_type === "YES_NO"
            ? new Set(["YES", "NO", "N/A", null])
            : new Set(["G", "S", "P", "N/A", null]);
        expect(entry.daily_values.every((value) => allowed.has(value))).toBe(true);
        expect(entry.daily_values[0]).toBe("N/A");
      }
    });
  });

  it("keeps blank distinct from N/A and applies the frozen dominance rules", () => {
    const fixture = loadCanonicalFixture();
    const values = fixture.reports.flatMap((report) =>
      report.item_ratings.flatMap((entry) => entry.daily_values),
    );

    expect(values).toContain(null);
    expect(values).toContain("N/A");
    expect(calculateWeeklyRatingSummary(["N/A", "P", "P", "S", "S", "G", null])).toEqual({
      g_count: 1,
      s_count: 2,
      p_count: 2,
      na_count: 1,
      blank_count: 1,
      applicable_day_count: 5,
      weekly_dominant_rating: "P",
      tie_break_applied: true,
    });
    expect(() =>
      calculateWeeklyRatingSummary(["N/A", "YES", "YES", "YES", "YES", "YES", "YES"]),
    ).toThrow(/does not accept YES\/NO/i);
  });

  it("derives the scaffold story from daily values independently of its expectations", () => {
    const fixture = loadCanonicalFixture();
    const scaffoldDailyValues = fixture.reports.map(
      (report) =>
        report.item_ratings.find(
          (entry) => entry.item_id === "working_at_height_scaffolds",
        )!.daily_values,
    );
    const summaries = scaffoldDailyValues.map(calculateWeeklyRatingSummary);

    expect(scaffoldDailyValues).toEqual(EXPECTED_SCAFFOLD_DAILY_VALUES);
    expect(summaries.map((summary) => summary.weekly_dominant_rating)).toEqual([
      "S",
      "P",
      "P",
      "S",
      "P",
    ]);
    expect(summaries[1]).toEqual(
      expect.objectContaining({
        p_count: 3,
        s_count: 3,
        tie_break_applied: true,
        weekly_dominant_rating: "P",
      }),
    );
    expect(fixture.story_expectations.scaffold_weekly_dominant_sequence).toEqual([
      "S",
      "P",
      "P",
      "S",
      "P",
    ]);
    expect(fixture.story_expectations.required_finding_types).toEqual(EXPECTED_FINDING_TYPES);
  });

  it("contains exactly one intentional ladder G/recommendation inconsistency", () => {
    const fixture = loadCanonicalFixture();
    const cases = fixture.reports.flatMap((report) =>
      report.recommendations
        .filter((entry) => entry.intentional_case === "rating_recommendation_inconsistency")
        .map((entry) => ({ report, entry })),
    );

    expect(cases).toHaveLength(1);
    expect(fixture.story_expectations.intentional_ladder_inconsistency_count).toBe(1);
    const { report, entry } = cases[0]!;
    expect(entry.recommendation).toMatch(/damaged ladder side rail/i);
    expect(entry.recommendation).toMatch(/remove.*from use|replace|isolate/i);
    expect(entry.linked_observations).toHaveLength(1);
    const link = entry.linked_observations[0]!;
    expect(link.item_id).toBe("access_and_egress_ladders");
    const ladder = report.item_ratings.find((item) => item.item_id === link.item_id)!;
    const dayIndex = Math.round(
      (Date.parse(`${link.inspection_date}T00:00:00Z`) -
        Date.parse(`${report.week_start_date}T00:00:00Z`)) /
        86_400_000,
    );
    expect(ladder.daily_values[dayIndex]).toBe("G");
  });

  it("rejects a second evidence-derived ladder inconsistency without a marker", () => {
    const fixture = structuredClone(loadCanonicalFixture());
    fixture.reports[0]!.recommendations.push({
      recommendation_id: "F3A-R01-REC-03",
      page_number: 4,
      recommendation:
        "Damaged ladder side rail observed at the fictional access. Remove the ladder from use and replace it before further work.",
      extraction_status: "Confirmed",
      linked_observations: [
        { item_id: "access_and_egress_ladders", inspection_date: "2026-06-01" },
      ],
      source_reference: {
        report_id: "F3A-R01",
        page_number: 4,
        recommendation_entry_id: "F3A-R01-REC-03",
        display_reference: "F3A-R01 / p.4 / Recommendation 3",
      },
    });

    expect(() => validateCanonicalFixture(fixture)).toThrow(/ladder inconsistency/i);
  });

  it.each(["Weather conditions were noted.", "A safety alert was received."])(
    "rejects external context in fixture facts: %s",
    (externalContext) => {
      const fixture = structuredClone(loadCanonicalFixture());
      fixture.reports[0]!.recommendations[0]!.recommendation = externalContext;

      expect(() => validateCanonicalFixture(fixture)).toThrow(/external context/i);
    },
  );

  it("contains a Poor observation without a linked recommendation", () => {
    const fixture = loadCanonicalFixture();
    const unlinkedPoor = fixture.reports.flatMap((report) => {
      const linked = new Set(
        report.recommendations.flatMap((entry) =>
          entry.linked_observations.map((link) => `${link.item_id}:${link.inspection_date}`),
        ),
      );
      return report.item_ratings.flatMap((entry) =>
        entry.daily_values.flatMap((rating, dayIndex) => {
          const key = `${entry.item_id}:${addDays(report.week_start_date, dayIndex)}`;
          return rating === "P" && !linked.has(key) ? [key] : [];
        }),
      );
    });

    expect(unlinkedPoor).toContain("general_housekeeping:2026-06-15");
    expect(unlinkedPoor.length).toBeGreaterThanOrEqual(
      fixture.story_expectations.minimum_poor_without_recommendation,
    );
  });

  it("keeps PPE and fire prevention stable without Poor ratings", () => {
    const catalogue = loadFieldCatalogue();
    const fixture = loadCanonicalFixture();
    const stableIds = new Set(
      catalogue.sections
        .filter((section) =>
          ["personal_protective_equipment", "fire_prevention"].includes(section.section_id),
        )
        .flatMap((section) => section.items.map((item) => item.item_id)),
    );

    for (const report of fixture.reports) {
      for (const entry of report.item_ratings.filter((item) => stableIds.has(item.item_id))) {
        expect(entry.daily_values).not.toContain("P");
      }
    }
  });

  it("links Page 4 recommendations and all source references to real fixture evidence", () => {
    const fixture = loadCanonicalFixture();
    const catalogue = loadFieldCatalogue();
    const itemIds = new Set(
      catalogue.sections.flatMap((section) => section.items.map((item) => item.item_id)),
    );

    for (const report of fixture.reports) {
      for (const entry of report.recommendations) {
        expect(entry.page_number).toBe(4);
        expect(entry.source_reference.report_id).toBe(report.report_id);
        expect(entry.source_reference.recommendation_entry_id).toBe(entry.recommendation_id);
        expect(entry.source_reference.display_reference).toContain(`${report.report_id} / p.4`);
        expect(entry.linked_observations.length).toBeGreaterThan(0);
        entry.linked_observations.forEach((link) => {
          expect(itemIds.has(link.item_id)).toBe(true);
          expect(link.inspection_date >= report.week_start_date).toBe(true);
          expect(link.inspection_date <= report.week_end_date).toBe(true);
        });
      }
    }

    for (const expectation of fixture.story_expectations.expected_finding_references) {
      expect(EXPECTED_FINDING_TYPES).toContain(expectation.finding_type);
      expectation.evidence.forEach((reference) => {
        const report = fixture.reports.find((entry) => entry.report_id === reference.report_id)!;
        expect(report).toBeDefined();
        expect(itemIds.has(reference.item_id)).toBe(true);
        expect(reference.inspection_date >= report.week_start_date).toBe(true);
        expect(reference.inspection_date <= report.week_end_date).toBe(true);
      });
    }
  });

  it("includes three post-extraction review cases without OCR confidence", () => {
    const fixture = loadCanonicalFixture();
    const needsReview = fixture.extraction_review_annotations.filter(
      (entry) => entry.extraction_status === "Needs review",
    );

    expect(needsReview).toHaveLength(3);
    expect(needsReview.map((entry) => entry.case_type).sort()).toEqual([
      "ambiguous_recommendation_item_reference",
      "missing_or_unclear_acknowledgement_signature",
      "unclear_handwritten_recommendation",
    ]);
    expect(JSON.stringify(fixture)).not.toMatch(/ocr.?confidence/i);
    expect(fixture.extraction_review_notice).toMatch(/OCR is not implemented/i);
  });

  it("uses only clearly fictional identities and signature marks", () => {
    const fixture = loadCanonicalFixture();

    expect(fixture.synthetic_data_notice).toBe("SYNTHETIC DEMONSTRATION — NOT A REAL SITE RECORD");
    expect(JSON.stringify(fixture.project_metadata)).toMatch(/fictional|synthetic/i);
    expect(JSON.stringify(fixture.company_metadata)).toMatch(/fictional|synthetic/i);
    expect(Object.values(fixture.personnel_metadata).every((value) => /fictional/i.test(value))).toBe(
      true,
    );
    fixture.reports.forEach((report) => {
      expect(report.signatures.safety_supervisor_signature.value).toMatch(/^FICTIONAL-/);
      const acknowledgement = report.signatures.proprietor_or_safety_officer_signature.value;
      expect(acknowledgement === null || acknowledgement.startsWith("FICTIONAL-")).toBe(true);
    });
  });

  it("rejects invalid fixture mutations and prohibited fields", () => {
    const wrongItem = structuredClone(loadCanonicalFixture());
    wrongItem.reports[1]!.item_ratings[4]!.item_id = "not_in_catalogue";
    expect(() => validateCanonicalFixture(wrongItem)).toThrow(/catalogue item/i);

    const wrongStatus = structuredClone(loadCanonicalFixture());
    wrongStatus.extraction_review_annotations[1]!.extraction_status = "Pending" as "Needs review";
    expect(() => validateCanonicalFixture(wrongStatus)).toThrow();

    const prohibited = structuredClone(loadCanonicalFixture()) as unknown as Record<string, unknown>;
    prohibited["remarks"] = "not allowed";
    expect(() => validateCanonicalFixture(prohibited)).toThrow(/prohibited field/i);
  });
});
