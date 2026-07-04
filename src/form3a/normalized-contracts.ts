import { z } from "zod";

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ReportIdSchema = z.string().regex(/^F3A-R0[1-5]$/);
const PageNumberSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const ExtractionStatusSchema = z.enum(["Extracted", "Needs review", "Confirmed"]);
const WeekdaySchema = z.enum([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);
const RatingSchema = z.enum(["G", "S", "P", "YES", "NO", "N/A"]).nullable();

const ObservationSourceReferenceSchema = z
  .object({
    report_id: ReportIdSchema,
    page_number: PageNumberSchema,
    section_id: z.string().regex(/^[a-z0-9_]+$/),
    item_id: z.string().regex(/^[a-z0-9_]+$/),
    inspection_date: DateSchema,
    weekday: WeekdaySchema,
    display_reference: z.string().min(1),
  })
  .strict();

export const NormalizedObservationSchema = z
  .object({
    observation_id: z.string().min(1),
    report_id: ReportIdSchema,
    report_start_date: DateSchema,
    report_end_date: DateSchema,
    inspection_date: DateSchema,
    weekday: WeekdaySchema,
    page_number: PageNumberSchema,
    section_id: z.string().regex(/^[a-z0-9_]+$/),
    item_id: z.string().regex(/^[a-z0-9_]+$/),
    rating_type: z.enum(["GSP", "YES_NO"]),
    rating: RatingSchema,
    recommendation_id: z.string().regex(/^F3A-R0[1-5]-REC-\d{2}$/).nullable(),
    recommendation: z.string().min(1).nullable(),
    extraction_status: ExtractionStatusSchema,
    source_reference: ObservationSourceReferenceSchema,
  })
  .strict();

const WeeklySummaryBase = z.object({
  summary_id: z.string().min(1),
  report_id: ReportIdSchema,
  report_start_date: DateSchema,
  report_end_date: DateSchema,
  page_number: PageNumberSchema,
  section_id: z.string().regex(/^[a-z0-9_]+$/),
  item_id: z.string().regex(/^[a-z0-9_]+$/),
  na_count: z.number().int().nonnegative(),
  blank_count: z.number().int().nonnegative(),
  applicable_day_count: z.number().int().nonnegative(),
  observation_ids: z.array(z.string().min(1)).length(7),
  source_reference: z
    .object({
      report_id: ReportIdSchema,
      page_number: PageNumberSchema,
      section_id: z.string().regex(/^[a-z0-9_]+$/),
      item_id: z.string().regex(/^[a-z0-9_]+$/),
      display_reference: z.string().min(1),
    })
    .strict(),
});

const GspWeeklySummarySchema = WeeklySummaryBase.extend({
  rating_type: z.literal("GSP"),
  g_count: z.number().int().nonnegative(),
  s_count: z.number().int().nonnegative(),
  p_count: z.number().int().nonnegative(),
  weekly_dominant_rating: z.enum(["G", "S", "P"]).nullable(),
  tie_break_applied: z.boolean(),
}).strict();

const YesNoWeeklySummarySchema = WeeklySummaryBase.extend({
  rating_type: z.literal("YES_NO"),
  yes_count: z.number().int().nonnegative(),
  no_count: z.number().int().nonnegative(),
  weekly_dominant_rating: z.null(),
}).strict();

export const WeeklySummarySchema = z.discriminatedUnion("rating_type", [
  GspWeeklySummarySchema,
  YesNoWeeklySummarySchema,
]);

const NormalizedRecommendationSchema = z
  .object({
    recommendation_id: z.string().regex(/^F3A-R0[1-5]-REC-\d{2}$/),
    report_id: ReportIdSchema,
    page_number: z.literal(4),
    recommendation: z.string().min(1),
    extraction_status: ExtractionStatusSchema,
    intentional_case: z.literal("rating_recommendation_inconsistency").optional(),
    linked_observation_ids: z.array(z.string().min(1)).min(1),
    source_reference: z
      .object({
        report_id: ReportIdSchema,
        page_number: z.literal(4),
        recommendation_entry_id: z.string().regex(/^F3A-R0[1-5]-REC-\d{2}$/),
        display_reference: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export const NormalizedDataSchema = z
  .object({
    schema_version: z.literal("1.0.0"),
    fixture_version: z.string().min(1),
    source_catalogue_version: z.string().min(1),
    source_fixture: z.literal("data/form3a/canonical-five-week-fixture.json"),
    observations: z.array(NormalizedObservationSchema).length(2_275),
    weekly_summaries: z.array(WeeklySummarySchema).length(325),
    recommendations: z.array(NormalizedRecommendationSchema).min(1),
  })
  .strict();

const ExtractionReviewCaseSchema = z
  .object({
    case_id: z.string().regex(/^EXTRACTION-REVIEW-\d{2}$/),
    case_type: z.enum([
      "unclear_handwritten_recommendation",
      "missing_or_unclear_acknowledgement_signature",
      "ambiguous_recommendation_item_reference",
    ]),
    extraction_status: z.literal("Needs review"),
    issue_description: z.string().min(1),
    source_reference: z
      .object({
        report_id: ReportIdSchema,
        page_number: PageNumberSchema,
        item_id: z.string().regex(/^[a-z0-9_]+$/).optional(),
        recommendation_entry_id: z.string().regex(/^F3A-R0[1-5]-REC-\d{2}$/).optional(),
        field_id: z.string().regex(/^[a-z0-9_]+$/).optional(),
        display_reference: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export const ExtractionReviewDataSchema = z
  .object({
    schema_version: z.literal("1.0.0"),
    fixture_version: z.string().min(1),
    source_fixture: z.literal("data/form3a/canonical-five-week-fixture.json"),
    extraction_review_notice: z.string().min(1),
    cases: z.array(ExtractionReviewCaseSchema).min(2),
  })
  .strict();

export type NormalizedData = z.infer<typeof NormalizedDataSchema>;
export type ExtractionReviewData = z.infer<typeof ExtractionReviewDataSchema>;
