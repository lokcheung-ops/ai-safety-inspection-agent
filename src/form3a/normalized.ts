import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { type FieldCatalogue } from "./contracts.js";
import { calculateWeeklyRatingSummary, loadCanonicalFixture } from "./fixture.js";
import { type CanonicalFixture, type DailyRatingValue } from "./fixture-contracts.js";
import { loadFieldCatalogue } from "./catalogue.js";
import {
  ExtractionReviewDataSchema,
  NormalizedDataSchema,
  type ExtractionReviewData,
  type NormalizedData,
} from "./normalized-contracts.js";

const SOURCE_FIXTURE = "data/form3a/canonical-five-week-fixture.json" as const;
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const NORMALIZED_DATA_PATH = resolve(
  process.cwd(),
  "generated/work-package-1/normalized-data.json",
);
export const EXTRACTION_REVIEW_CASES_PATH = resolve(
  process.cwd(),
  "generated/work-package-1/extraction-review-cases.json",
);

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function observationId(reportId: string, itemId: string, date: string): string {
  return `${reportId}:${itemId}:${date}`;
}

function assertNoProhibitedFields(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertNoProhibitedFields);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (/^remarks?$/i.test(key)) throw new Error(`Prohibited field: ${key}`);
      if (/ocr.?confidence/i.test(key)) throw new Error(`Prohibited OCR confidence field: ${key}`);
      if (key === "safety_review_status" || key === "review_status") {
        throw new Error(`Prohibited review field: ${key}`);
      }
      assertNoProhibitedFields(child);
    }
  }
}

function countYesNo(values: readonly DailyRatingValue[]) {
  return values.reduce(
    (counts, value) => {
      if (value === "YES") counts.yes_count += 1;
      else if (value === "NO") counts.no_count += 1;
      else if (value === "N/A") counts.na_count += 1;
      else if (value === null) counts.blank_count += 1;
      else throw new Error(`YES_NO item contains unsupported value: ${value}`);
      return counts;
    },
    { yes_count: 0, no_count: 0, na_count: 0, blank_count: 0 },
  );
}

export function validateNormalizedData(input: unknown): NormalizedData {
  assertNoProhibitedFields(input);
  const data = NormalizedDataSchema.parse(input);
  const observationIds = data.observations.map((entry) => entry.observation_id);
  if (new Set(observationIds).size !== observationIds.length) {
    throw new Error("Normalized observation IDs must be unique");
  }
  const knownObservationIds = new Set(observationIds);
  for (const recommendation of data.recommendations) {
    if (recommendation.linked_observation_ids.some((id) => !knownObservationIds.has(id))) {
      throw new Error(`Recommendation source does not resolve: ${recommendation.recommendation_id}`);
    }
  }
  for (const summary of data.weekly_summaries) {
    if (summary.observation_ids.some((id) => !knownObservationIds.has(id))) {
      throw new Error(`Weekly summary source does not resolve: ${summary.summary_id}`);
    }
  }
  return data;
}

export function validateExtractionReviewData(input: unknown): ExtractionReviewData {
  assertNoProhibitedFields(input);
  return ExtractionReviewDataSchema.parse(input);
}

export function generateGate4aData(
  fixture: CanonicalFixture,
  catalogue: FieldCatalogue,
): { normalizedData: NormalizedData; extractionReviewData: ExtractionReviewData } {
  const observations: NormalizedData["observations"] = [];
  const weeklySummaries: NormalizedData["weekly_summaries"] = [];

  for (const report of fixture.reports) {
    const recommendationByObservation = new Map(
      report.recommendations.flatMap((recommendation) =>
        recommendation.linked_observations.map((link) => [
          observationId(report.report_id, link.item_id, link.inspection_date),
          recommendation,
        ] as const),
      ),
    );

    for (const section of catalogue.sections) {
      for (const item of section.items) {
        const fixtureItem = report.item_ratings.find((entry) => entry.item_id === item.item_id);
        if (fixtureItem === undefined) throw new Error(`Missing fixture item: ${item.item_id}`);

        const itemObservationIds = fixtureItem.daily_values.map((rating, dayIndex) => {
          const inspectionDate = addDays(report.week_start_date, dayIndex);
          const id = observationId(report.report_id, item.item_id, inspectionDate);
          const linkedRecommendation = recommendationByObservation.get(id);
          observations.push({
            observation_id: id,
            report_id: report.report_id,
            report_start_date: report.week_start_date,
            report_end_date: report.week_end_date,
            inspection_date: inspectionDate,
            weekday: WEEKDAYS[dayIndex]!,
            page_number: item.page_number,
            section_id: item.section_id,
            item_id: item.item_id,
            rating_type: item.rating_type,
            rating,
            recommendation_id: linkedRecommendation?.recommendation_id ?? null,
            recommendation: linkedRecommendation?.recommendation ?? null,
            extraction_status: fixtureItem.extraction_status,
            source_reference: {
              report_id: report.report_id,
              page_number: item.page_number,
              section_id: item.section_id,
              item_id: item.item_id,
              inspection_date: inspectionDate,
              weekday: WEEKDAYS[dayIndex]!,
              display_reference: `${report.report_id} / p.${item.page_number} / ${section.label_en} / ${item.label_en} / ${WEEKDAYS[dayIndex]}`,
            },
          });
          return id;
        });

        const summaryBase = {
          summary_id: `${report.report_id}:${item.item_id}:weekly`,
          report_id: report.report_id,
          report_start_date: report.week_start_date,
          report_end_date: report.week_end_date,
          page_number: item.page_number,
          section_id: item.section_id,
          item_id: item.item_id,
          observation_ids: itemObservationIds,
          source_reference: {
            report_id: report.report_id,
            page_number: item.page_number,
            section_id: item.section_id,
            item_id: item.item_id,
            display_reference: `${report.report_id} / p.${item.page_number} / ${section.label_en} / ${item.label_en} / Weekly summary`,
          },
        };

        if (item.rating_type === "GSP") {
          weeklySummaries.push({
            ...summaryBase,
            rating_type: "GSP",
            ...calculateWeeklyRatingSummary(fixtureItem.daily_values),
          });
        } else {
          const counts = countYesNo(fixtureItem.daily_values);
          weeklySummaries.push({
            ...summaryBase,
            rating_type: "YES_NO",
            ...counts,
            applicable_day_count: counts.yes_count + counts.no_count,
            weekly_dominant_rating: null,
          });
        }
      }
    }
  }

  const recommendations: NormalizedData["recommendations"] = fixture.reports.flatMap((report) =>
    report.recommendations.map((entry) => ({
      recommendation_id: entry.recommendation_id,
      report_id: report.report_id,
      page_number: entry.page_number,
      recommendation: entry.recommendation,
      extraction_status: entry.extraction_status,
      ...(entry.intentional_case === undefined
        ? {}
        : { intentional_case: entry.intentional_case }),
      linked_observation_ids: entry.linked_observations.map((link) =>
        observationId(report.report_id, link.item_id, link.inspection_date),
      ),
      source_reference: entry.source_reference,
    })),
  );

  const normalizedData = validateNormalizedData({
    schema_version: "1.0.0",
    fixture_version: fixture.fixture_version,
    source_catalogue_version: fixture.source_catalogue_version,
    source_fixture: SOURCE_FIXTURE,
    observations,
    weekly_summaries: weeklySummaries,
    recommendations,
  });
  const extractionReviewData = validateExtractionReviewData({
    schema_version: "1.0.0",
    fixture_version: fixture.fixture_version,
    source_fixture: SOURCE_FIXTURE,
    extraction_review_notice: fixture.extraction_review_notice,
    cases: fixture.extraction_review_annotations,
  });

  return { normalizedData, extractionReviewData };
}

export function serializeDeterministicJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function writeGate4aArtifacts(): void {
  const output = generateGate4aData(loadCanonicalFixture(), loadFieldCatalogue());
  for (const [path, value] of [
    [NORMALIZED_DATA_PATH, output.normalizedData],
    [EXTRACTION_REVIEW_CASES_PATH, output.extractionReviewData],
  ] as const) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, serializeDeterministicJson(value), "utf8");
  }
}

export function loadNormalizedData(path = NORMALIZED_DATA_PATH): NormalizedData {
  return validateNormalizedData(JSON.parse(readFileSync(path, "utf8")));
}
