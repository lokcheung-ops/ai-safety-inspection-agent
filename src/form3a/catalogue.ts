import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { FieldCatalogueSchema, type FieldCatalogue } from "./contracts.js";

const EXPECTED_SECTION_COUNTS: Readonly<Record<string, number>> = {
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
};

const EXPECTED_PAGE_COUNTS: Readonly<Record<number, number>> = {
  1: 9,
  2: 21,
  3: 26,
  4: 9,
};

export const FIELD_CATALOGUE_PATH = resolve(
  process.cwd(),
  "data/form3a/field-catalogue.json",
);

function assertNoProhibitedKeys(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertNoProhibitedKeys);
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (/^remarks?$/i.test(key)) {
        throw new Error(`Prohibited field: ${key}`);
      }
      assertNoProhibitedKeys(child);
    }
  }
}

function assertUnique(values: readonly string[], description: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${description}: ${value}`);
    seen.add(value);
  }
}

export function validateFieldCatalogue(input: unknown): FieldCatalogue {
  assertNoProhibitedKeys(input);
  const catalogue = FieldCatalogueSchema.parse(input);
  const items = catalogue.sections.flatMap((section) => section.items);

  assertUnique(
    catalogue.sections.map((section) => section.section_id),
    "section ID",
  );
  assertUnique(
    items.map((item) => item.item_id),
    "item ID",
  );
  assertUnique(
    catalogue.document_fields.map((field) => field.field_id),
    "document field ID",
  );

  const sectionOrders = catalogue.sections.map((section) => section.official_section_order);
  const expectedSectionOrders = Array.from(
    { length: catalogue.sections.length },
    (_, index) => index + 1,
  );
  if (JSON.stringify(sectionOrders) !== JSON.stringify(expectedSectionOrders)) {
    throw new Error("Official section order must be consecutive");
  }

  for (const section of catalogue.sections) {
    if (section.source_form_reference.page_number !== section.page_number) {
      throw new Error(`Incorrect source page mapping for section ${section.section_id}`);
    }

    const expectedCount = EXPECTED_SECTION_COUNTS[section.section_id];
    if (expectedCount === undefined || section.items.length !== expectedCount) {
      throw new Error(`Incorrect item count for section ${section.section_id}`);
    }

    const itemOrders = section.items.map((item) => item.official_item_order);
    const expectedItemOrders = Array.from(
      { length: section.items.length },
      (_, index) => index + 1,
    );
    if (JSON.stringify(itemOrders) !== JSON.stringify(expectedItemOrders)) {
      throw new Error(`Official item order must be consecutive for ${section.section_id}`);
    }

    for (const item of section.items) {
      if (
        item.section_id !== section.section_id ||
        item.page_number !== section.page_number ||
        item.official_section_order !== section.official_section_order ||
        item.source_form_reference.page_number !== section.page_number
      ) {
        throw new Error(`Incorrect page mapping for item ${item.item_id}`);
      }
    }
  }

  if (items.length !== 65) throw new Error("Catalogue must contain exactly 65 items");
  for (const [page, expectedCount] of Object.entries(EXPECTED_PAGE_COUNTS)) {
    const actualCount = items.filter((item) => item.page_number === Number(page)).length;
    if (actualCount !== expectedCount) {
      throw new Error(`Incorrect item count for page ${page}`);
    }
  }

  const yesNoItems = items.filter((item) => item.rating_type === "YES_NO");
  if (yesNoItems.length !== 1) throw new Error("Catalogue must contain exactly one YES_NO item");
  if (yesNoItems[0]?.item_id !== "general_notice_of_employment") {
    throw new Error("YES_NO rating type must belong to the notice-of-employment item");
  }

  for (const field of catalogue.document_fields) {
    if (field.source_form_reference.page_number !== field.page_number) {
      throw new Error(`Incorrect source page mapping for document field ${field.field_id}`);
    }
  }

  const recommendationFields = catalogue.document_fields.filter(
    (field) => field.field_id === "recommendation",
  );
  if (
    recommendationFields.length !== 1 ||
    catalogue.document_fields.some((field) => field.field_id === "recommendations")
  ) {
    throw new Error("Document fields must use the singular recommendation ID");
  }

  return catalogue;
}

export function loadFieldCatalogue(path = FIELD_CATALOGUE_PATH): FieldCatalogue {
  return validateFieldCatalogue(JSON.parse(readFileSync(path, "utf8")));
}
