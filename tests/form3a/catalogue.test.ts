import { describe, expect, it } from "vitest";

import {
  loadFieldCatalogue,
  validateFieldCatalogue,
} from "../../src/form3a/catalogue.js";

const EXPECTED_SECTION_COUNTS = {
  access_and_egress: 4,
  working_at_height: 5,
  earthwork: 6,
  lifting_appliances_and_lifting_gear: 8,
  electricity: 7,
  fire_prevention: 5,
  health: 8,
  machinery: 5,
  general: 8,
  personal_protective_equipment: 9,
} as const;

const EXPECTED_PAGE_COUNTS = { 1: 9, 2: 21, 3: 26, 4: 9 } as const;

describe("official Form 3A field catalogue", () => {
  it("contains the complete 65-item, four-page official structure", () => {
    const catalogue = loadFieldCatalogue();
    const items = catalogue.sections.flatMap((section) => section.items);

    expect(catalogue.source.page_count).toBe(4);
    expect(new Set(catalogue.sections.map((section) => section.page_number))).toEqual(
      new Set([1, 2, 3, 4]),
    );
    expect(items).toHaveLength(65);

    for (const [sectionId, count] of Object.entries(EXPECTED_SECTION_COUNTS)) {
      const section = catalogue.sections.find((entry) => entry.section_id === sectionId);
      expect(section?.items).toHaveLength(count);
    }

    for (const [page, count] of Object.entries(EXPECTED_PAGE_COUNTS)) {
      expect(items.filter((item) => item.page_number === Number(page))).toHaveLength(count);
    }
  });

  it("uses stable unique IDs, official ordering, and bilingual labels", () => {
    const catalogue = loadFieldCatalogue();
    const items = catalogue.sections.flatMap((section) => section.items);
    const sectionIds = catalogue.sections.map((section) => section.section_id);
    const itemIds = items.map((item) => item.item_id);

    expect(new Set(sectionIds).size).toBe(sectionIds.length);
    expect(new Set(itemIds).size).toBe(itemIds.length);
    expect(catalogue.sections.map((section) => section.official_section_order)).toEqual(
      Array.from({ length: 10 }, (_, index) => index + 1),
    );

    for (const section of catalogue.sections) {
      expect(section.label_en).not.toBe("");
      expect(section.label_zh).not.toBe("");
      expect(section.items.map((item) => item.official_item_order)).toEqual(
        Array.from({ length: section.items.length }, (_, index) => index + 1),
      );

      for (const item of section.items) {
        expect(item.label_en).not.toBe("");
        expect(item.label_zh).not.toBe("");
        expect(item.section_id).toBe(section.section_id);
        expect(item.page_number).toBe(section.page_number);
        expect(item.official_section_order).toBe(section.official_section_order);
        expect(item.source_form_reference.page_number).toBe(section.page_number);
      }
    }
  });

  it("assigns YES_NO only to the official notice-of-employment item", () => {
    const catalogue = loadFieldCatalogue();
    const items = catalogue.sections.flatMap((section) => section.items);
    const yesNoItems = items.filter((item) => item.rating_type === "YES_NO");

    expect(yesNoItems).toEqual([
      expect.objectContaining({
        item_id: "general_notice_of_employment",
        label_en: "Notice of Employment of Safety Officer/Safety Supervisor (YES/NO)",
        label_zh: "有關僱用安全主任／安全督導員的告示（有／沒有）",
        page_number: 3,
        section_id: "general",
        official_item_order: 7,
      }),
    ]);
    expect(items.filter((item) => item.rating_type === "GSP")).toHaveLength(64);
  });

  it("represents recommendations and signatures only as document fields", () => {
    const catalogue = loadFieldCatalogue();
    const itemIds = catalogue.sections.flatMap((section) =>
      section.items.map((item) => item.item_id),
    );
    const documentFieldIds = catalogue.document_fields.map((field) => field.field_id);

    expect(documentFieldIds).toContain("recommendations");
    expect(documentFieldIds).toContain("safety_supervisor_signature");
    expect(documentFieldIds).toContain("proprietor_or_safety_officer_signature");
    expect(catalogue.document_fields.every((field) => field.rating_type === "NONE")).toBe(true);
    expect(catalogue.document_fields.every((field) => !field.supports_weekday_rating)).toBe(true);
    expect(itemIds).not.toContain("recommendations");
    expect(itemIds.some((id) => id.includes("signature"))).toBe(false);
  });

  it("rejects duplicate IDs, incorrect page mappings, and invalid rating types", () => {
    const catalogue = loadFieldCatalogue();

    const duplicateId = structuredClone(catalogue);
    duplicateId.sections[0]!.items[1]!.item_id = duplicateId.sections[0]!.items[0]!.item_id;
    expect(() => validateFieldCatalogue(duplicateId)).toThrow(/duplicate item ID/i);

    const wrongPage = structuredClone(catalogue);
    wrongPage.sections[0]!.items[0]!.page_number = 2;
    expect(() => validateFieldCatalogue(wrongPage)).toThrow(/page mapping/i);

    const secondYesNo = structuredClone(catalogue);
    secondYesNo.sections[0]!.items[0]!.rating_type = "YES_NO";
    expect(() => validateFieldCatalogue(secondYesNo)).toThrow(/exactly one YES_NO/i);
  });

  it("contains no prohibited remark-based data fields or identifiers", () => {
    const catalogue = loadFieldCatalogue();
    const prohibitedKeys: string[] = [];

    const visit = (value: unknown): void => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (value && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) {
          if (/^remarks?$/i.test(key)) prohibitedKeys.push(key);
          visit(child);
        }
      }
    };

    visit(catalogue);
    expect(prohibitedKeys).toEqual([]);
    expect(JSON.stringify(catalogue)).not.toContain("rating_remarks_inconsistency");
  });
});
