import { resolve } from "node:path";

import type { FieldCatalogue } from "./contracts.js";
import type { CanonicalFixture } from "./fixture-contracts.js";
import type { NormalizedData } from "./normalized-contracts.js";

export type WorkbookCellValue = string | number | boolean | Date | null;

export interface WorkbookSheetData {
  name: string;
  headers: string[];
  rows: WorkbookCellValue[][];
  dateColumns: string[];
}

export const NORMALIZED_XLSX_PATH = resolve(
  process.cwd(),
  "generated/work-package-1/normalized-data.xlsx",
);

function dateValue(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function reportsSheet(fixture: CanonicalFixture): WorkbookSheetData {
  const headers = [
    "report_id",
    "week_start_date",
    "week_end_date",
    "page_count",
    "number_of_workers",
    "project_name",
    "construction_site_address",
    "company_name",
    "principal_contractor_name",
    "safety_supervisor_name",
    "safety_officer_name",
    "proprietor_representative_name",
  ];
  return {
    name: "Reports",
    headers,
    dateColumns: ["week_start_date", "week_end_date"],
    rows: fixture.reports.map((report) => [
      report.report_id,
      dateValue(report.week_start_date),
      dateValue(report.week_end_date),
      report.page_count,
      report.number_of_workers,
      fixture.project_metadata.project_name,
      fixture.project_metadata.construction_site_address,
      fixture.company_metadata.company_name,
      fixture.company_metadata.principal_contractor_name,
      fixture.personnel_metadata.safety_supervisor_name,
      fixture.personnel_metadata.safety_officer_name,
      fixture.personnel_metadata.proprietor_representative_name,
    ]),
  };
}

function observationsSheet(data: NormalizedData): WorkbookSheetData {
  const headers = [
    "observation_id",
    "report_id",
    "report_start_date",
    "report_end_date",
    "inspection_date",
    "weekday",
    "page_number",
    "section_id",
    "item_id",
    "rating_type",
    "rating",
    "recommendation_id",
    "recommendation",
    "extraction_status",
    "source_reference",
  ];
  return {
    name: "Observations",
    headers,
    dateColumns: ["report_start_date", "report_end_date", "inspection_date"],
    rows: data.observations.map((entry) => [
      entry.observation_id,
      entry.report_id,
      dateValue(entry.report_start_date),
      dateValue(entry.report_end_date),
      dateValue(entry.inspection_date),
      entry.weekday,
      entry.page_number,
      entry.section_id,
      entry.item_id,
      entry.rating_type,
      entry.rating,
      entry.recommendation_id,
      entry.recommendation,
      entry.extraction_status,
      entry.source_reference.display_reference,
    ]),
  };
}

function recommendationsSheet(data: NormalizedData): WorkbookSheetData {
  const headers = [
    "recommendation_id",
    "report_id",
    "page_number",
    "recommendation",
    "extraction_status",
    "intentional_case",
    "linked_observation_ids",
    "source_reference",
  ];
  return {
    name: "Recommendations",
    headers,
    dateColumns: [],
    rows: data.recommendations.map((entry) => [
      entry.recommendation_id,
      entry.report_id,
      entry.page_number,
      entry.recommendation,
      entry.extraction_status,
      entry.intentional_case ?? null,
      entry.linked_observation_ids.join(" | "),
      entry.source_reference.display_reference,
    ]),
  };
}

function extractionReviewSheet(fixture: CanonicalFixture): WorkbookSheetData {
  const headers = [
    "case_id",
    "case_type",
    "extraction_status",
    "issue_description",
    "report_id",
    "page_number",
    "item_id",
    "recommendation_entry_id",
    "field_id",
    "source_reference",
  ];
  return {
    name: "Extraction Review",
    headers,
    dateColumns: [],
    rows: fixture.extraction_review_annotations.map((entry) => [
      entry.case_id,
      entry.case_type,
      entry.extraction_status,
      entry.issue_description,
      entry.source_reference.report_id,
      entry.source_reference.page_number,
      entry.source_reference.item_id ?? null,
      entry.source_reference.recommendation_entry_id ?? null,
      entry.source_reference.field_id ?? null,
      entry.source_reference.display_reference,
    ]),
  };
}

function weeklySummariesSheet(data: NormalizedData): WorkbookSheetData {
  const headers = [
    "summary_id",
    "report_id",
    "report_start_date",
    "report_end_date",
    "page_number",
    "section_id",
    "item_id",
    "rating_type",
    "g_count",
    "s_count",
    "p_count",
    "yes_count",
    "no_count",
    "na_count",
    "blank_count",
    "applicable_day_count",
    "weekly_dominant_rating",
    "tie_break_applied",
    "observation_ids",
    "source_reference",
  ];
  return {
    name: "Weekly Summaries",
    headers,
    dateColumns: ["report_start_date", "report_end_date"],
    rows: data.weekly_summaries.map((entry) => [
      entry.summary_id,
      entry.report_id,
      dateValue(entry.report_start_date),
      dateValue(entry.report_end_date),
      entry.page_number,
      entry.section_id,
      entry.item_id,
      entry.rating_type,
      entry.rating_type === "GSP" ? entry.g_count : null,
      entry.rating_type === "GSP" ? entry.s_count : null,
      entry.rating_type === "GSP" ? entry.p_count : null,
      entry.rating_type === "YES_NO" ? entry.yes_count : null,
      entry.rating_type === "YES_NO" ? entry.no_count : null,
      entry.na_count,
      entry.blank_count,
      entry.applicable_day_count,
      entry.weekly_dominant_rating,
      entry.rating_type === "GSP" ? entry.tie_break_applied : null,
      entry.observation_ids.join(" | "),
      entry.source_reference.display_reference,
    ]),
  };
}

function expectedFindingsSheet(fixture: CanonicalFixture): WorkbookSheetData {
  const headers = [
    "record_type",
    "finding_type",
    "evidence_count",
    "evidence_references",
  ];
  return {
    name: "Expected Findings",
    headers,
    dateColumns: [],
    rows: fixture.story_expectations.expected_finding_references.map((entry) => [
      "EXPECTATION_ONLY",
      entry.finding_type,
      entry.evidence.length,
      entry.evidence.map((reference) => reference.display_reference).join(" | "),
    ]),
  };
}

function fieldCatalogueSheet(catalogue: FieldCatalogue): WorkbookSheetData {
  const headers = [
    "entry_type",
    "stable_id",
    "label_en",
    "label_zh",
    "page_number",
    "section_id",
    "official_section_order",
    "official_item_or_field_order",
    "rating_type",
    "supports_weekday_rating",
    "field_type",
    "source_form_reference",
  ];
  const itemRows = catalogue.sections.flatMap((section) =>
    section.items.map((item) => [
      "inspection_item",
      item.item_id,
      item.label_en,
      item.label_zh,
      item.page_number,
      item.section_id,
      item.official_section_order,
      item.official_item_order,
      item.rating_type,
      item.supports_weekday_rating,
      null,
      `${item.source_form_reference.form_id} / p.${item.source_form_reference.page_number} / ${item.source_form_reference.footer_reference}`,
    ]),
  );
  const documentFieldRows = catalogue.document_fields.map((field) => [
    "document_field",
    field.field_id,
    field.label_en,
    field.label_zh,
    field.page_number,
    null,
    null,
    field.official_field_order,
    field.rating_type,
    field.supports_weekday_rating,
    field.field_type,
    `${field.source_form_reference.form_id} / p.${field.source_form_reference.page_number} / ${field.source_form_reference.footer_reference}`,
  ]);
  return {
    name: "Field Catalogue",
    headers,
    dateColumns: [],
    rows: [...itemRows, ...documentFieldRows],
  };
}

export function deriveGate4bWorkbookData(
  fixture: CanonicalFixture,
  normalizedData: NormalizedData,
  catalogue: FieldCatalogue,
): WorkbookSheetData[] {
  return [
    reportsSheet(fixture),
    observationsSheet(normalizedData),
    recommendationsSheet(normalizedData),
    extractionReviewSheet(fixture),
    weeklySummariesSheet(normalizedData),
    expectedFindingsSheet(fixture),
    fieldCatalogueSheet(catalogue),
  ];
}
