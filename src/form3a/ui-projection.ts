import type { FieldCatalogue } from "./contracts.js";
import type { CanonicalFixture } from "./fixture-contracts.js";
import type { ExtractionReviewData, NormalizedData } from "./normalized-contracts.js";

export const UI_PROJECTION_PATH = "generated/work-package-1/ui-projection.json";
export const GATE4D_SOURCES = {
  canonical_fixture: "data/form3a/canonical-five-week-fixture.json",
  field_catalogue: "data/form3a/field-catalogue.json",
  normalized_data: "generated/work-package-1/normalized-data.json",
  extraction_review_cases: "generated/work-package-1/extraction-review-cases.json",
  normalized_xlsx: "generated/work-package-1/normalized-data.xlsx",
  individual_pdf_directory: "generated/work-package-1/pdfs",
  combined_pdf: "generated/work-package-1/pdfs/form3a-five-week-combined.pdf",
} as const;

type ReportId = CanonicalFixture["reports"][number]["report_id"];
type PageNumber = 1 | 2 | 3 | 4;

export interface UiPageProjection {
  page_id: string;
  report_id: ReportId;
  page_number: PageNumber;
  page_indicator: string;
  previous_page_id: string | null;
  next_page_id: string | null;
  individual_pdf_reference: {
    artifact_path: string;
    page_number: PageNumber;
  };
  combined_pdf_reference: {
    artifact_path: string;
    page_number: number;
  };
  section_ids: string[];
  item_ids: string[];
  observation_ids: string[];
  summary_ids: string[];
  recommendation_ids: string[];
  extraction_review_case_ids: string[];
}

export interface UiReportProjection {
  report_id: ReportId;
  switcher_label: string;
  metadata: {
    week_start_date: string;
    week_end_date: string;
    number_of_workers: number;
    project: CanonicalFixture["project_metadata"];
    company: CanonicalFixture["company_metadata"];
    personnel: CanonicalFixture["personnel_metadata"];
  };
  artifacts: {
    normalized_xlsx: { artifact_path: string };
    individual_pdf: { artifact_path: string; page_count: 4 };
    combined_pdf: { artifact_path: string; start_page: number; end_page: number };
  };
  pages: UiPageProjection[];
  observations: NormalizedData["observations"];
  weekly_summaries: NormalizedData["weekly_summaries"];
  recommendations: NormalizedData["recommendations"];
  extraction_review_queue: ExtractionReviewData["cases"];
}

export interface Gate4dUiProjection {
  schema_version: "1.0.0";
  fixture_version: string;
  source_catalogue_version: string;
  sources: typeof GATE4D_SOURCES;
  navigation: {
    default_report_id: ReportId;
    default_page_id: string;
    preview_mode: "single_page";
  };
  report_order: ReportId[];
  catalogue: {
    catalogue_version: string;
    source: FieldCatalogue["source"];
    sections: FieldCatalogue["sections"];
    document_fields: FieldCatalogue["document_fields"];
  };
  reports: UiReportProjection[];
}

export function deriveGate4dUiProjection(
  fixture: CanonicalFixture,
  catalogue: FieldCatalogue,
  normalizedData: NormalizedData,
  extractionReviewData: ExtractionReviewData,
): Gate4dUiProjection {
  const reportOrder = fixture.reports.map((report) => report.report_id);
  const reports = fixture.reports.map((report, reportIndex): UiReportProjection => {
    const observations = normalizedData.observations.filter(
      (entry) => entry.report_id === report.report_id,
    );
    const weeklySummaries = normalizedData.weekly_summaries.filter(
      (entry) => entry.report_id === report.report_id,
    );
    const recommendations = normalizedData.recommendations.filter(
      (entry) => entry.report_id === report.report_id,
    );
    const extractionReviewQueue = extractionReviewData.cases.filter(
      (entry) => entry.source_reference.report_id === report.report_id,
    );
    const individualPdfPath = `${GATE4D_SOURCES.individual_pdf_directory}/${report.report_id}.pdf`;
    const combinedStartPage = reportIndex * 4 + 1;

    return {
      report_id: report.report_id,
      switcher_label: `${report.report_id} | ${report.week_start_date} to ${report.week_end_date}`,
      metadata: {
        week_start_date: report.week_start_date,
        week_end_date: report.week_end_date,
        number_of_workers: report.number_of_workers,
        project: fixture.project_metadata,
        company: fixture.company_metadata,
        personnel: fixture.personnel_metadata,
      },
      artifacts: {
        normalized_xlsx: { artifact_path: GATE4D_SOURCES.normalized_xlsx },
        individual_pdf: { artifact_path: individualPdfPath, page_count: 4 },
        combined_pdf: {
          artifact_path: GATE4D_SOURCES.combined_pdf,
          start_page: combinedStartPage,
          end_page: combinedStartPage + 3,
        },
      },
      pages: ([1, 2, 3, 4] as const).map((pageNumber) =>
        derivePageProjection(
          report.report_id,
          reportIndex,
          pageNumber,
          catalogue,
          observations,
          weeklySummaries,
          recommendations,
          extractionReviewQueue,
          individualPdfPath,
        ),
      ),
      observations,
      weekly_summaries: weeklySummaries,
      recommendations,
      extraction_review_queue: extractionReviewQueue,
    };
  });

  return validateGate4dUiProjection({
    schema_version: "1.0.0",
    fixture_version: fixture.fixture_version,
    source_catalogue_version: catalogue.catalogue_version,
    sources: GATE4D_SOURCES,
    navigation: {
      default_report_id: reportOrder[0]!,
      default_page_id: `${reportOrder[0]}:page:1`,
      preview_mode: "single_page",
    },
    report_order: reportOrder,
    catalogue: {
      catalogue_version: catalogue.catalogue_version,
      source: catalogue.source,
      sections: catalogue.sections,
      document_fields: catalogue.document_fields,
    },
    reports,
  });
}

function derivePageProjection(
  reportId: ReportId,
  reportIndex: number,
  pageNumber: PageNumber,
  catalogue: FieldCatalogue,
  observations: NormalizedData["observations"],
  summaries: NormalizedData["weekly_summaries"],
  recommendations: NormalizedData["recommendations"],
  extractionReviewCases: ExtractionReviewData["cases"],
  individualPdfPath: string,
): UiPageProjection {
  const sections = catalogue.sections.filter((section) => section.page_number === pageNumber);
  return {
    page_id: `${reportId}:page:${pageNumber}`,
    report_id: reportId,
    page_number: pageNumber,
    page_indicator: `${pageNumber} / 4`,
    previous_page_id: pageNumber === 1 ? null : `${reportId}:page:${pageNumber - 1}`,
    next_page_id: pageNumber === 4 ? null : `${reportId}:page:${pageNumber + 1}`,
    individual_pdf_reference: {
      artifact_path: individualPdfPath,
      page_number: pageNumber,
    },
    combined_pdf_reference: {
      artifact_path: GATE4D_SOURCES.combined_pdf,
      page_number: reportIndex * 4 + pageNumber,
    },
    section_ids: sections.map((section) => section.section_id),
    item_ids: sections.flatMap((section) => section.items.map((item) => item.item_id)),
    observation_ids: observations
      .filter((entry) => entry.page_number === pageNumber)
      .map((entry) => entry.observation_id),
    summary_ids: summaries
      .filter((entry) => entry.page_number === pageNumber)
      .map((entry) => entry.summary_id),
    recommendation_ids: recommendations
      .filter((entry) => entry.page_number === pageNumber)
      .map((entry) => entry.recommendation_id),
    extraction_review_case_ids: extractionReviewCases
      .filter((entry) => entry.source_reference.page_number === pageNumber)
      .map((entry) => entry.case_id),
  };
}

export function validateGate4dUiProjection(
  projection: Gate4dUiProjection,
): Gate4dUiProjection {
  assertNoForbiddenKeys(projection);
  if (projection.reports.length !== 5 || projection.report_order.length !== 5) {
    throw new Error("Gate 4D projection must contain five reports");
  }
  assertUnique(projection.report_order, "report ID");
  if (
    projection.reports.some(
      (report, index) => report.report_id !== projection.report_order[index],
    )
  ) {
    throw new Error("Gate 4D report order does not match report_order");
  }

  for (const [reportIndex, report] of projection.reports.entries()) {
    if (report.pages.length !== 4) throw new Error(`${report.report_id} must contain four pages`);
    assertUnique(report.observations.map((entry) => entry.observation_id), "observation ID");
    assertUnique(report.weekly_summaries.map((entry) => entry.summary_id), "summary ID");
    assertUnique(report.recommendations.map((entry) => entry.recommendation_id), "recommendation ID");
    assertUnique(report.pages.map((entry) => entry.page_id), "page ID");

    report.pages.forEach((page, pageIndex) => {
      const pageNumber = pageIndex + 1;
      if (
        page.page_number !== pageNumber ||
        page.combined_pdf_reference.page_number !== reportIndex * 4 + pageNumber
      ) {
        throw new Error(`Invalid page ordering for ${page.page_id}`);
      }
      assertIdsResolve(
        page.observation_ids,
        report.observations.map((entry) => entry.observation_id),
        "observation",
      );
      assertIdsResolve(
        page.summary_ids,
        report.weekly_summaries.map((entry) => entry.summary_id),
        "summary",
      );
      assertIdsResolve(
        page.recommendation_ids,
        report.recommendations.map((entry) => entry.recommendation_id),
        "recommendation",
      );
      assertIdsResolve(
        page.extraction_review_case_ids,
        report.extraction_review_queue.map((entry) => entry.case_id),
        "extraction review case",
      );
    });
  }
  return projection;
}

function assertNoForbiddenKeys(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertNoForbiddenKeys);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (/^remarks?$/i.test(key)) throw new Error(`Prohibited field: ${key}`);
      if (/^(?:findings?|manifest|ocr|weather|safety_alert|components?|screens?)$/i.test(key)) {
        throw new Error(`Out-of-scope Gate 4D field: ${key}`);
      }
      assertNoForbiddenKeys(child);
    }
  }
}

function assertUnique(values: readonly string[], description: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${description}`);
}

function assertIdsResolve(
  references: readonly string[],
  available: readonly string[],
  description: string,
): void {
  const known = new Set(available);
  if (references.some((reference) => !known.has(reference))) {
    throw new Error(`Unresolved ${description} reference`);
  }
}
