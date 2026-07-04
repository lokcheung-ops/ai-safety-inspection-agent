import { z } from "zod";

const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ReportIdSchema = z.string().regex(/^F3A-R0[1-5]$/);
const PageNumberSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
const ExtractionStatusSchema = z.enum(["Extracted", "Needs review", "Confirmed"]);
const DailyRatingSchema = z.enum(["G", "S", "P", "YES", "NO", "N/A"]).nullable();
const DailyValuesSchema = z.tuple([
  DailyRatingSchema,
  DailyRatingSchema,
  DailyRatingSchema,
  DailyRatingSchema,
  DailyRatingSchema,
  DailyRatingSchema,
  DailyRatingSchema,
]);

const EvidenceReferenceSchema = z
  .object({
    report_id: ReportIdSchema,
    page_number: PageNumberSchema,
    item_id: z.string().regex(/^[a-z0-9_]+$/),
    inspection_date: DateSchema,
    recommendation_entry_id: z.string().regex(/^[A-Z0-9-]+$/).optional(),
    display_reference: z.string().min(1),
  })
  .strict();

const RecommendationSchema = z
  .object({
    recommendation_id: z.string().regex(/^F3A-R0[1-5]-REC-\d{2}$/),
    page_number: z.literal(4),
    recommendation: z.string().min(1),
    extraction_status: ExtractionStatusSchema,
    intentional_case: z.literal("rating_recommendation_inconsistency").optional(),
    linked_observations: z
      .array(
        z
          .object({
            item_id: z.string().regex(/^[a-z0-9_]+$/),
            inspection_date: DateSchema,
          })
          .strict(),
      )
      .min(1),
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

const SignatureValueSchema = z
  .object({
    value: z.string().min(1).nullable(),
    extraction_status: ExtractionStatusSchema,
  })
  .strict();

export const CanonicalFixtureSchema = z
  .object({
    fixture_version: z.string().min(1),
    source_catalogue_version: z.string().min(1),
    synthetic_data_notice: z.literal("SYNTHETIC DEMONSTRATION — NOT A REAL SITE RECORD"),
    extraction_review_notice: z.string().min(1),
    project_metadata: z
      .object({
        project_name: z.string().min(1),
        construction_site_address: z.string().min(1),
      })
      .strict(),
    company_metadata: z
      .object({
        company_name: z.string().min(1),
        principal_contractor_name: z.string().min(1),
      })
      .strict(),
    personnel_metadata: z
      .object({
        safety_supervisor_name: z.string().min(1),
        safety_officer_name: z.string().min(1),
        proprietor_representative_name: z.string().min(1),
      })
      .strict(),
    reports: z
      .array(
        z
          .object({
            report_id: ReportIdSchema,
            week_start_date: DateSchema,
            week_end_date: DateSchema,
            page_count: z.literal(4),
            number_of_workers: z.number().int().positive(),
            item_ratings: z
              .array(
                z
                  .object({
                    item_id: z.string().regex(/^[a-z0-9_]+$/),
                    daily_values: DailyValuesSchema,
                    extraction_status: ExtractionStatusSchema,
                  })
                  .strict(),
              )
              .length(65),
            recommendations: z.array(RecommendationSchema).min(1),
            signatures: z
              .object({
                safety_supervisor_signature: SignatureValueSchema,
                safety_supervisor_date: SignatureValueSchema,
                report_discussion_acknowledgement: SignatureValueSchema,
                report_discussion_date: SignatureValueSchema,
                proprietor_or_safety_officer_signature: SignatureValueSchema,
              })
              .strict(),
          })
          .strict(),
      )
      .length(5),
    extraction_review_annotations: z
      .array(
        z
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
          .strict(),
      )
      .min(2),
    story_expectations: z
      .object({
        scaffold_item_id: z.literal("working_at_height_scaffolds"),
        scaffold_weekly_dominant_sequence: z.tuple([
          z.literal("S"),
          z.literal("P"),
          z.literal("P"),
          z.literal("S"),
          z.literal("P"),
        ]),
        required_finding_types: z.tuple([
          z.literal("repeated_or_worsening_rating"),
          z.literal("improved_then_recurred"),
          z.literal("rating_recommendation_inconsistency"),
          z.literal("poor_without_recommendation"),
          z.literal("missing_follow_up_evidence"),
        ]),
        intentional_ladder_inconsistency_count: z.literal(1),
        minimum_poor_without_recommendation: z.number().int().min(1),
        expected_finding_references: z
          .array(
            z
              .object({
                finding_type: z.enum([
                  "repeated_or_worsening_rating",
                  "improved_then_recurred",
                  "rating_recommendation_inconsistency",
                  "poor_without_recommendation",
                  "missing_follow_up_evidence",
                ]),
                evidence: z.array(EvidenceReferenceSchema).min(1),
              })
              .strict(),
          )
          .length(5),
      })
      .strict(),
  })
  .strict();

export type CanonicalFixture = z.infer<typeof CanonicalFixtureSchema>;
export type DailyRatingValue = z.infer<typeof DailyRatingSchema>;
