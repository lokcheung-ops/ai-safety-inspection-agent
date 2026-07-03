import { z } from "zod";

const PageNumberSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

const SourceFormReferenceSchema = z
  .object({
    form_id: z.literal("SOSS-F3A"),
    page_number: PageNumberSchema,
    footer_reference: z.string().min(1),
  })
  .strict();

export const InspectionItemSchema = z
  .object({
    item_id: z.string().regex(/^[a-z0-9_]+$/),
    label_en: z.string().min(1),
    label_zh: z.string().min(1),
    page_number: PageNumberSchema,
    section_id: z.string().regex(/^[a-z0-9_]+$/),
    official_section_order: z.number().int().positive(),
    official_item_order: z.number().int().positive(),
    rating_type: z.enum(["GSP", "YES_NO"]),
    supports_weekday_rating: z.literal(true),
    source_form_reference: SourceFormReferenceSchema,
  })
  .strict();

export const CatalogueSectionSchema = z
  .object({
    section_id: z.string().regex(/^[a-z0-9_]+$/),
    label_en: z.string().min(1),
    label_zh: z.string().min(1),
    page_number: PageNumberSchema,
    official_section_order: z.number().int().positive(),
    source_form_reference: SourceFormReferenceSchema,
    items: z.array(InspectionItemSchema).min(1),
  })
  .strict();

export const DocumentFieldSchema = z
  .object({
    field_id: z.string().regex(/^[a-z0-9_]+$/),
    label_en: z.string().min(1),
    label_zh: z.string().min(1),
    page_number: PageNumberSchema,
    official_field_order: z.number().int().positive(),
    field_type: z.enum(["metadata", "narrative", "signature", "date", "acknowledgement"]),
    rating_type: z.literal("NONE"),
    supports_weekday_rating: z.literal(false),
    source_form_reference: SourceFormReferenceSchema,
  })
  .strict();

export const FieldCatalogueSchema = z
  .object({
    catalogue_version: z.string().min(1),
    source: z
      .object({
        form_id: z.literal("SOSS-F3A"),
        title_en: z.string().min(1),
        title_zh: z.string().min(1),
        issuing_authority: z.string().min(1),
        source_url: z.url(),
        revision: z.string().min(1).nullable(),
        page_count: z.literal(4),
      })
      .strict(),
    sections: z.array(CatalogueSectionSchema).length(10),
    document_fields: z.array(DocumentFieldSchema).min(1),
  })
  .strict();

export type FieldCatalogue = z.infer<typeof FieldCatalogueSchema>;
