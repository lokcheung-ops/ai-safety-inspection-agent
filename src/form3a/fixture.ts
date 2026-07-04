import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadFieldCatalogue } from "./catalogue.js";
import {
  CanonicalFixtureSchema,
  type CanonicalFixture,
  type DailyRatingValue,
} from "./fixture-contracts.js";

export const CANONICAL_FIXTURE_PATH = resolve(
  process.cwd(),
  "data/form3a/canonical-five-week-fixture.json",
);

const EXPECTED_PERIODS = [
  ["2026-05-31", "2026-06-06"],
  ["2026-06-07", "2026-06-13"],
  ["2026-06-14", "2026-06-20"],
  ["2026-06-21", "2026-06-27"],
  ["2026-06-28", "2026-07-04"],
] as const;

type WeeklyDominantRating = "G" | "S" | "P" | null;

export interface WeeklyRatingSummary {
  g_count: number;
  s_count: number;
  p_count: number;
  na_count: number;
  blank_count: number;
  applicable_day_count: number;
  weekly_dominant_rating: WeeklyDominantRating;
  tie_break_applied: boolean;
}

function assertNoProhibitedKeys(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertNoProhibitedKeys);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (/^remarks?$/i.test(key)) throw new Error(`Prohibited field: ${key}`);
      if (/ocr.?confidence/i.test(key)) throw new Error(`Prohibited OCR confidence field: ${key}`);
      if (
        typeof child === "string" &&
        /\b(weather|typhoon|cyclone|monsoon|rain(?:fall|y)?|snow(?:fall|y)?|hail|storm|thunder(?:storm)?|lightning|fog(?:gy)?|wind(?:s|y)?|gust(?:s|y)?|precipitation|temperature|humidity|barometric\s+pressure|dew\s+point|heatwave|cold\s+snap|safety[ -]?alert)\b/i.test(
          child,
        )
      ) {
        throw new Error(`Prohibited external context in field: ${key}`);
      }
      assertNoProhibitedKeys(child);
    }
  }
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function assertUnique(values: readonly string[], description: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${description}`);
}

export function calculateWeeklyRatingSummary(
  dailyValues: readonly DailyRatingValue[],
): WeeklyRatingSummary {
  const counts = { G: 0, S: 0, P: 0, "N/A": 0, blank: 0 };
  for (const value of dailyValues) {
    if (value === null) counts.blank += 1;
    else if (value === "YES" || value === "NO") {
      throw new Error("Weekly GSP dominance does not accept YES/NO ratings");
    }
    else counts[value] += 1;
  }

  const severityOrder = ["P", "S", "G"] as const;
  const highestCount = Math.max(counts.G, counts.S, counts.P);
  const tiedRatings =
    highestCount === 0
      ? []
      : severityOrder.filter((rating) => counts[rating] === highestCount);

  return {
    g_count: counts.G,
    s_count: counts.S,
    p_count: counts.P,
    na_count: counts["N/A"],
    blank_count: counts.blank,
    applicable_day_count: counts.G + counts.S + counts.P,
    weekly_dominant_rating: tiedRatings[0] ?? null,
    tie_break_applied: tiedRatings.length > 1,
  };
}

export function validateCanonicalFixture(input: unknown): CanonicalFixture {
  assertNoProhibitedKeys(input);
  const fixture = CanonicalFixtureSchema.parse(input);
  const catalogue = loadFieldCatalogue();
  const catalogueItems = catalogue.sections.flatMap((section) => section.items);
  const catalogueById = new Map(catalogueItems.map((item) => [item.item_id, item]));
  const documentFieldsById = new Map(
    catalogue.document_fields.map((field) => [field.field_id, field]),
  );
  const expectedItemIds = new Set(catalogueById.keys());
  const reportsById = new Map(fixture.reports.map((report) => [report.report_id, report]));

  if (fixture.source_catalogue_version !== catalogue.catalogue_version) {
    throw new Error("Fixture catalogue version does not match the official catalogue");
  }
  const fictionalMetadata = [
    ...Object.values(fixture.project_metadata),
    ...Object.values(fixture.company_metadata),
    ...Object.values(fixture.personnel_metadata),
  ];
  if (fictionalMetadata.some((value) => !/fictional|synthetic/i.test(value))) {
    throw new Error("All project, company, and personnel metadata must be clearly fictional");
  }
  assertUnique(fixture.reports.map((report) => report.report_id), "report ID");

  fixture.reports.forEach((report, reportIndex) => {
    const expectedPeriod = EXPECTED_PERIODS[reportIndex];
    if (
      expectedPeriod === undefined ||
      report.week_start_date !== expectedPeriod[0] ||
      report.week_end_date !== expectedPeriod[1]
    ) {
      throw new Error(`Incorrect reporting period for ${report.report_id}`);
    }
    if (new Date(`${report.week_start_date}T00:00:00Z`).getUTCDay() !== 0) {
      throw new Error(`Report must start on Sunday: ${report.report_id}`);
    }
    if (addDays(report.week_start_date, 6) !== report.week_end_date) {
      throw new Error(`Report must end six days after Sunday: ${report.report_id}`);
    }

    assertUnique(report.item_ratings.map((entry) => entry.item_id), `${report.report_id} item ID`);
    const actualItemIds = new Set(report.item_ratings.map((entry) => entry.item_id));
    if (
      actualItemIds.size !== expectedItemIds.size ||
      [...expectedItemIds].some((itemId) => !actualItemIds.has(itemId))
    ) {
      throw new Error(`${report.report_id} must contain every catalogue item`);
    }

    for (const entry of report.item_ratings) {
      const catalogueItem = catalogueById.get(entry.item_id);
      if (catalogueItem === undefined) throw new Error(`Unknown catalogue item: ${entry.item_id}`);
      if (entry.daily_values[0] !== "N/A") {
        throw new Error(`Sunday must be N/A for ${report.report_id}/${entry.item_id}`);
      }
      const allowed =
        catalogueItem.rating_type === "YES_NO"
          ? new Set<DailyRatingValue>(["YES", "NO", "N/A", null])
          : new Set<DailyRatingValue>(["G", "S", "P", "N/A", null]);
      if (entry.daily_values.some((value) => !allowed.has(value))) {
        throw new Error(`Invalid rating for ${report.report_id}/${entry.item_id}`);
      }
    }

    assertUnique(
      report.recommendations.map((entry) => entry.recommendation_id),
      `${report.report_id} recommendation ID`,
    );
    for (const recommendation of report.recommendations) {
      if (
        recommendation.source_reference.report_id !== report.report_id ||
        recommendation.source_reference.recommendation_entry_id !== recommendation.recommendation_id
      ) {
        throw new Error(`Unresolvable recommendation source: ${recommendation.recommendation_id}`);
      }
      for (const link of recommendation.linked_observations) {
        if (!expectedItemIds.has(link.item_id)) {
          throw new Error(`Recommendation links unknown catalogue item: ${link.item_id}`);
        }
        if (link.inspection_date < report.week_start_date || link.inspection_date > report.week_end_date) {
          throw new Error(`Recommendation link date is outside ${report.report_id}`);
        }
      }
    }

    const signatureEntries = [
      report.signatures.safety_supervisor_signature,
      report.signatures.proprietor_or_safety_officer_signature,
    ];
    if (
      signatureEntries.some(
        (entry) => entry.value !== null && !entry.value.startsWith("FICTIONAL-"),
      )
    ) {
      throw new Error(`Signatures must use fictional marks in ${report.report_id}`);
    }
    if (
      report.signatures.safety_supervisor_date.value !== report.week_end_date ||
      report.signatures.report_discussion_date.value !== report.week_end_date
    ) {
      throw new Error(`Signature dates must resolve to the report period in ${report.report_id}`);
    }
  });

  const scaffoldSequence = fixture.reports.map((report) => {
    const scaffold = report.item_ratings.find(
      (entry) => entry.item_id === fixture.story_expectations.scaffold_item_id,
    );
    if (scaffold === undefined) throw new Error("Missing scaffold item");
    return calculateWeeklyRatingSummary(scaffold.daily_values).weekly_dominant_rating;
  });
  if (
    JSON.stringify(scaffoldSequence) !==
    JSON.stringify(fixture.story_expectations.scaffold_weekly_dominant_sequence)
  ) {
    throw new Error("Daily scaffold values do not match the expected weekly sequence");
  }

  const markedIntentionalCases = fixture.reports.flatMap((report) =>
    report.recommendations
      .filter((entry) => entry.intentional_case === "rating_recommendation_inconsistency")
      .map((recommendation) => ({ report, recommendation })),
  );
  const derivedLadderInconsistencies = fixture.reports.flatMap((report) =>
    report.recommendations.flatMap((recommendation) => {
      const hasLinkedGoodLadderRating = recommendation.linked_observations.some((link) => {
        if (link.item_id !== "access_and_egress_ladders") return false;
        const ladder = report.item_ratings.find((entry) => entry.item_id === link.item_id);
        const dayIndex = Math.round(
          (Date.parse(`${link.inspection_date}T00:00:00Z`) -
            Date.parse(`${report.week_start_date}T00:00:00Z`)) /
            86_400_000,
        );
        return ladder?.daily_values[dayIndex] === "G";
      });
      const describesDamagedLadder = /damaged ladder(?: side rail)?/i.test(
        recommendation.recommendation,
      );
      const requestsCorrectiveAction = /remove.*from use|replace|isolate/i.test(
        recommendation.recommendation,
      );
      return hasLinkedGoodLadderRating && describesDamagedLadder && requestsCorrectiveAction
        ? [{ report, recommendation }]
        : [];
    }),
  );
  if (
    derivedLadderInconsistencies.length !==
    fixture.story_expectations.intentional_ladder_inconsistency_count
  ) {
    throw new Error("Incorrect evidence-derived ladder inconsistency count");
  }
  const derivedRecommendationIds = new Set(
    derivedLadderInconsistencies.map(({ recommendation }) => recommendation.recommendation_id),
  );
  if (
    markedIntentionalCases.length !== derivedLadderInconsistencies.length ||
    markedIntentionalCases.some(
      ({ recommendation }) => !derivedRecommendationIds.has(recommendation.recommendation_id),
    )
  ) {
    throw new Error("Ladder inconsistency marker does not match the derived evidence");
  }

  const linkedObservations = new Set(
    fixture.reports.flatMap((report) =>
      report.recommendations.flatMap((recommendation) =>
        recommendation.linked_observations.map(
          (link) => `${report.report_id}:${link.item_id}:${link.inspection_date}`,
        ),
      ),
    ),
  );
  const poorWithoutRecommendation = fixture.reports.flatMap((report) =>
    report.item_ratings.flatMap((entry) =>
      entry.daily_values.filter((rating, dayIndex) => {
        const key = `${report.report_id}:${entry.item_id}:${addDays(report.week_start_date, dayIndex)}`;
        return rating === "P" && !linkedObservations.has(key);
      }),
    ),
  );
  if (
    poorWithoutRecommendation.length <
    fixture.story_expectations.minimum_poor_without_recommendation
  ) {
    throw new Error("Missing Poor observation without a recommendation");
  }

  const stableItemIds = new Set(
    catalogue.sections
      .filter((section) =>
        ["personal_protective_equipment", "fire_prevention"].includes(section.section_id),
      )
      .flatMap((section) => section.items.map((item) => item.item_id)),
  );
  if (
    fixture.reports.some((report) =>
      report.item_ratings.some(
        (entry) => stableItemIds.has(entry.item_id) && entry.daily_values.includes("P"),
      ),
    )
  ) {
    throw new Error("PPE and Fire Prevention must not contain P ratings");
  }

  assertUnique(
    fixture.extraction_review_annotations.map((entry) => entry.case_id),
    "extraction review case ID",
  );
  for (const annotation of fixture.extraction_review_annotations) {
    const reference = annotation.source_reference;
    const report = reportsById.get(reference.report_id);
    if (report === undefined) throw new Error(`Unknown extraction review report: ${reference.report_id}`);
    if (reference.item_id !== undefined && !expectedItemIds.has(reference.item_id)) {
      throw new Error(`Unknown extraction review item: ${reference.item_id}`);
    }
    if (
      reference.item_id !== undefined &&
      reference.recommendation_entry_id === undefined &&
      catalogueById.get(reference.item_id)?.page_number !== reference.page_number
    ) {
      throw new Error(`Incorrect extraction review source page: ${annotation.case_id}`);
    }
    if (
      reference.recommendation_entry_id !== undefined &&
      !report.recommendations.some(
        (entry) => entry.recommendation_id === reference.recommendation_entry_id,
      )
    ) {
      throw new Error(`Unknown extraction review recommendation: ${reference.recommendation_entry_id}`);
    }
    if (
      reference.field_id !== undefined &&
      documentFieldsById.get(reference.field_id)?.page_number !== reference.page_number
    ) {
      throw new Error(`Unknown extraction review document field: ${reference.field_id}`);
    }
  }

  for (const expectation of fixture.story_expectations.expected_finding_references) {
    for (const reference of expectation.evidence) {
      const report = reportsById.get(reference.report_id);
      if (report === undefined || !expectedItemIds.has(reference.item_id)) {
        throw new Error(`Unresolvable expected finding evidence: ${expectation.finding_type}`);
      }
      if (catalogueById.get(reference.item_id)?.page_number !== reference.page_number) {
        throw new Error(`Incorrect expected finding evidence page: ${expectation.finding_type}`);
      }
      if (
        reference.inspection_date < report.week_start_date ||
        reference.inspection_date > report.week_end_date
      ) {
        throw new Error(`Expected finding evidence date is outside ${reference.report_id}`);
      }
      const item = report.item_ratings.find((entry) => entry.item_id === reference.item_id);
      const dayIndex = Math.round(
        (Date.parse(`${reference.inspection_date}T00:00:00Z`) -
          Date.parse(`${report.week_start_date}T00:00:00Z`)) /
          86_400_000,
      );
      if (item?.daily_values[dayIndex] === undefined) {
        throw new Error(`Expected finding evidence observation does not resolve`);
      }
      if (
        reference.recommendation_entry_id !== undefined &&
        !report.recommendations.some(
          (entry) => entry.recommendation_id === reference.recommendation_entry_id,
        )
      ) {
        throw new Error(`Expected finding evidence recommendation does not resolve`);
      }
    }
  }

  return fixture;
}

export function loadCanonicalFixture(path = CANONICAL_FIXTURE_PATH): CanonicalFixture {
  return validateCanonicalFixture(JSON.parse(readFileSync(path, "utf8")));
}
