import { createWriteStream, readFileSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import PDFDocument from "pdfkit";

import { loadFieldCatalogue } from "./catalogue.js";
import type { FieldCatalogue } from "./contracts.js";
import { loadCanonicalFixture } from "./fixture.js";
import type { CanonicalFixture, DailyRatingValue } from "./fixture-contracts.js";
import { loadNormalizedData } from "./normalized.js";
import type { NormalizedData } from "./normalized-contracts.js";

const OUTPUT_DIR = path.resolve(
  process.env.GATE4C_OUTPUT_DIR ?? "generated/work-package-1/pdfs",
);
const COMBINED_FILE_NAME = "form3a-five-week-combined.pdf";
const FIXED_TIMESTAMP = new Date("2026-01-01T00:00:00.000Z");
const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 24;
const TABLE_WIDTH = PAGE_WIDTH - MARGIN * 2;
const ITEM_COLUMN_WIDTH = 478;
const DAY_COLUMN_WIDTH = (TABLE_WIDTH - ITEM_COLUMN_WIDTH) / 7;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type FixtureReport = CanonicalFixture["reports"][number];
type CatalogueSection = FieldCatalogue["sections"][number];

interface ReportRenderData {
  fixture: CanonicalFixture;
  catalogue: FieldCatalogue;
  report: FixtureReport;
  ratingsByItem: Map<string, DailyRatingValue[]>;
  recommendations: NormalizedData["recommendations"];
}

interface FontChunk {
  name: string;
  filePath: string;
  ranges: Array<[number, number]>;
}

class NotoSansHkFont {
  private readonly chunks: FontChunk[];
  private readonly registered = new Set<string>();

  constructor(private readonly document: PDFKit.PDFDocument) {
    this.chunks = loadFontChunks();
  }

  fontForCharacter(character: string): string {
    const codePoint = character.codePointAt(0);
    if (codePoint !== undefined && codePoint <= 0x7f) return "Helvetica";
    const chunk = this.chunks.find(({ ranges }) =>
      ranges.some(([start, end]) => codePoint !== undefined && codePoint >= start && codePoint <= end),
    );
    if (chunk === undefined) throw new Error(`Noto Sans HK does not cover character: ${character}`);
    if (!this.registered.has(chunk.name)) {
      this.document.registerFont(chunk.name, chunk.filePath);
      this.registered.add(chunk.name);
    }
    return chunk.name;
  }

  draw(
    text: string,
    x: number,
    y: number,
    options: { size: number; width?: number; align?: "left" | "center" | "right"; color?: string },
  ): void {
    const runs = segmentTextByFont(text, (character) => this.fontForCharacter(character));
    const runWidths = runs.map(({ font, text: runText }) =>
      this.document.font(font).fontSize(options.size).widthOfString(runText),
    );
    const totalWidth = runWidths.reduce((sum, width) => sum + width, 0);
    const availableWidth = options.width ?? totalWidth;
    const startX =
      options.align === "center"
        ? x + (availableWidth - totalWidth) / 2
        : options.align === "right"
          ? x + availableWidth - totalWidth
          : x;

    let cursor = startX;
    runs.forEach(({ font, text: runText }, index) => {
      this.document
        .font(font)
        .fontSize(options.size)
        .fillColor(options.color ?? "#172033")
        .text(runText, cursor, y, { lineBreak: false });
      cursor += runWidths[index] ?? 0;
    });
  }
}

const fixture = loadCanonicalFixture();
const catalogue = loadFieldCatalogue();
const normalizedData = loadNormalizedData();
const reports = fixture.reports.map((report) =>
  deriveReportRenderData(fixture, catalogue, normalizedData, report),
);

await fs.mkdir(OUTPUT_DIR, { recursive: true });
for (const report of reports) {
  await writePdf(path.join(OUTPUT_DIR, `${report.report.report_id}.pdf`), [report]);
}
await writePdf(path.join(OUTPUT_DIR, COMBINED_FILE_NAME), reports);

async function writePdf(filePath: string, documents: ReportRenderData[]): Promise<void> {
  const title =
    documents.length === 1
      ? `${documents[0]!.report.report_id} Form 3A Synthetic Demonstration`
      : "Five-week Form 3A Synthetic Demonstration";
  const document = new PDFDocument({
    autoFirstPage: false,
    compress: false,
    info: {
      Title: title,
      Author: "Safety Inspection Report Review Assistant",
      Subject: "Synthetic Form 3A demonstration records",
      Keywords: "Form 3A, synthetic demonstration, safety inspection",
      Creator: "Gate 4C deterministic PDF generator",
      Producer: "PDFKit 0.19.1",
      CreationDate: FIXED_TIMESTAMP,
      ModDate: FIXED_TIMESTAMP,
    },
  });
  const stream = createWriteStream(filePath);
  document.pipe(stream);

  for (const report of documents) {
    for (let pageNumber = 1; pageNumber <= 4; pageNumber += 1) {
      document.addPage({ size: "A4", layout: "landscape", margin: 0 });
      drawFormPage(document, report, pageNumber);
    }
  }
  document.end();
  await new Promise<void>((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

function deriveReportRenderData(
  sourceFixture: CanonicalFixture,
  sourceCatalogue: FieldCatalogue,
  sourceNormalizedData: NormalizedData,
  report: FixtureReport,
): ReportRenderData {
  const ratingsByItem = new Map<string, DailyRatingValue[]>();
  for (const item of report.item_ratings) {
    const observations = sourceNormalizedData.observations
      .filter(
        (observation) =>
          observation.report_id === report.report_id && observation.item_id === item.item_id,
      )
      .sort((left, right) => left.inspection_date.localeCompare(right.inspection_date));
    const ratings = observations.map((observation) => observation.rating);
    if (ratings.length !== 7 || JSON.stringify(ratings) !== JSON.stringify(item.daily_values)) {
      throw new Error(`Normalized observations do not match ${report.report_id}/${item.item_id}`);
    }
    ratingsByItem.set(item.item_id, ratings);
  }

  const recommendations = sourceNormalizedData.recommendations.filter(
    (recommendation) => recommendation.report_id === report.report_id,
  );
  if (
    recommendations.length !== report.recommendations.length ||
    recommendations.some(
      (recommendation, index) =>
        recommendation.recommendation_id !== report.recommendations[index]?.recommendation_id ||
        recommendation.recommendation !== report.recommendations[index]?.recommendation,
    )
  ) {
    throw new Error(`Normalized recommendations do not match ${report.report_id}`);
  }

  return {
    fixture: sourceFixture,
    catalogue: sourceCatalogue,
    report,
    ratingsByItem,
    recommendations,
  };
}

function drawFormPage(
  document: PDFKit.PDFDocument,
  data: ReportRenderData,
  pageNumber: number,
): void {
  const font = new NotoSansHkFont(document);
  const sections = data.catalogue.sections.filter((section) => section.page_number === pageNumber);
  drawHeader(document, font, data, pageNumber);
  const tableBottom = pageNumber === 4 ? 306 : 548;
  const tableEnd = drawInspectionTable(document, font, data, sections, pageNumber, tableBottom);
  if (pageNumber === 4) drawPageFourDetails(document, font, data, tableEnd + 7);
  drawFooter(document, data, pageNumber);
}

function drawHeader(
  document: PDFKit.PDFDocument,
  font: NotoSansHkFont,
  data: ReportRenderData,
  pageNumber: number,
): void {
  document
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor("#A12A1F")
    .text(data.fixture.synthetic_data_notice, MARGIN, 11, { width: TABLE_WIDTH, align: "center" });
  document
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#172033")
    .text(data.catalogue.source.title_en, MARGIN, 25, { width: TABLE_WIDTH, align: "center" });
  font.draw(data.catalogue.source.title_zh, MARGIN, 39, {
    size: 8,
    width: TABLE_WIDTH,
    align: "center",
  });

  document
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor("#172033")
    .text(
      `Report: ${data.report.report_id}   Week: ${data.report.week_start_date} to ${data.report.week_end_date}   Workers: ${data.report.number_of_workers}   Form page: ${pageNumber}/4`,
      MARGIN,
      54,
      { width: TABLE_WIDTH },
    );
  document
    .font("Helvetica")
    .fontSize(6.3)
    .text(`Project: ${data.fixture.project_metadata.project_name}`, MARGIN, 66, {
      width: TABLE_WIDTH,
    })
    .text(`Company: ${data.fixture.company_metadata.company_name}`, MARGIN, 76, {
      width: 385,
    })
    .text(`Site: ${data.fixture.project_metadata.construction_site_address}`, 410, 76, {
      width: PAGE_WIDTH - 410 - MARGIN,
      align: "right",
    });
}

function drawInspectionTable(
  document: PDFKit.PDFDocument,
  font: NotoSansHkFont,
  data: ReportRenderData,
  sections: CatalogueSection[],
  pageNumber: number,
  tableBottom: number,
): number {
  const tableTop = 91;
  const headerHeight = 25;
  const sectionHeight = 14;
  const itemCount = sections.reduce((sum, section) => sum + section.items.length, 0);
  const itemHeight = Math.min(
    24,
    (tableBottom - tableTop - headerHeight - sections.length * sectionHeight) / itemCount,
  );
  const dates = weekDates(data.report.week_start_date);
  let y = tableTop;

  fillAndStroke(document, MARGIN, y, TABLE_WIDTH, headerHeight, "#D9E8F5", "#2A4D69");
  document
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor("#172033")
    .text("Inspection item", MARGIN + 5, y + 4, { width: ITEM_COLUMN_WIDTH - 10 });
  font.draw("巡查項目", MARGIN + 5, y + 13, { size: 6, width: ITEM_COLUMN_WIDTH - 10 });
  dates.forEach((date, index) => {
    const x = MARGIN + ITEM_COLUMN_WIDTH + DAY_COLUMN_WIDTH * index;
    document.rect(x, y, DAY_COLUMN_WIDTH, headerHeight).stroke("#2A4D69");
    document
      .font("Helvetica-Bold")
      .fontSize(5.8)
      .fillColor("#172033")
      .text(WEEKDAYS[index]!, x, y + 4, { width: DAY_COLUMN_WIDTH, align: "center" })
      .font("Helvetica")
      .fontSize(5.4)
      .text(date.slice(5), x, y + 13, { width: DAY_COLUMN_WIDTH, align: "center" });
  });
  y += headerHeight;

  for (const section of sections) {
    fillAndStroke(document, MARGIN, y, TABLE_WIDTH, sectionHeight, "#EDF3F8", "#5C7184");
    document
      .font("Helvetica-Bold")
      .fontSize(6.4)
      .fillColor("#172033")
      .text(section.label_en, MARGIN + 5, y + 3, { lineBreak: false });
    const englishWidth = document.widthOfString(section.label_en);
    font.draw(section.label_zh, MARGIN + 10 + englishWidth, y + 2.5, { size: 6.2 });
    y += sectionHeight;

    for (const item of section.items) {
      fillAndStroke(document, MARGIN, y, TABLE_WIDTH, itemHeight, "#FFFFFF", "#A7B4C0");
      const englishSize = fitTextSize(document, item.label_en, ITEM_COLUMN_WIDTH - 12, 5.8, 4.4);
      document
        .font("Helvetica")
        .fontSize(englishSize)
        .fillColor("#172033")
        .text(item.label_en, MARGIN + 5, y + 2, {
          width: ITEM_COLUMN_WIDTH - 10,
          lineBreak: false,
        });
      font.draw(item.label_zh, MARGIN + 5, y + itemHeight / 2, {
        size: Math.min(5.6, itemHeight / 2.7),
        width: ITEM_COLUMN_WIDTH - 10,
      });

      const ratings = data.ratingsByItem.get(item.item_id);
      if (ratings === undefined) throw new Error(`Missing PDF ratings for ${item.item_id}`);
      ratings.forEach((rating, index) => {
        const x = MARGIN + ITEM_COLUMN_WIDTH + DAY_COLUMN_WIDTH * index;
        document.rect(x, y, DAY_COLUMN_WIDTH, itemHeight).stroke("#A7B4C0");
        document
          .font("Helvetica-Bold")
          .fontSize(6.4)
          .fillColor(ratingColor(rating))
          .text(rating ?? "", x, y + Math.max(2, itemHeight / 2 - 3), {
            width: DAY_COLUMN_WIDTH,
            align: "center",
            lineBreak: false,
          });
      });
      y += itemHeight;
    }
  }

  const expectedItemCount = [9, 21, 26, 9][pageNumber - 1];
  if (itemCount !== expectedItemCount) throw new Error(`Incorrect item count on PDF page ${pageNumber}`);
  return y;
}

function drawPageFourDetails(
  document: PDFKit.PDFDocument,
  font: NotoSansHkFont,
  data: ReportRenderData,
  startY: number,
): void {
  const recommendationField = field(data.catalogue, "recommendation");
  document
    .font("Helvetica-Bold")
    .fontSize(7.2)
    .fillColor("#172033")
    .text(recommendationField.label_en, MARGIN, startY, { lineBreak: false });
  const titleWidth = document.widthOfString(recommendationField.label_en);
  font.draw(recommendationField.label_zh, MARGIN + titleWidth + 7, startY - 0.5, { size: 7 });

  let y = startY + 13;
  for (const recommendation of data.recommendations) {
    const height = data.recommendations.length > 1 ? 34 : 52;
    fillAndStroke(document, MARGIN, y, TABLE_WIDTH, height, "#FAFBFC", "#A7B4C0");
    document
      .font("Helvetica-Bold")
      .fontSize(6.2)
      .fillColor("#172033")
      .text(`${recommendation.recommendation_id} [${recommendation.extraction_status}]`, MARGIN + 5, y + 4, {
        width: TABLE_WIDTH - 10,
      })
      .font("Helvetica")
      .fontSize(6.2)
      .text(recommendation.recommendation, MARGIN + 5, y + 13, {
        width: TABLE_WIDTH - 10,
        height: height - 15,
        ellipsis: false,
      });
    y += height;
  }

  const signatureTop = Math.max(y + 8, 414);
  const signatureWidth = TABLE_WIDTH / 3;
  drawSignatureBox(
    document,
    font,
    data.catalogue,
    "safety_supervisor_signature",
    data.report.signatures.safety_supervisor_signature,
    MARGIN,
    signatureTop,
    signatureWidth,
  );
  drawSignatureBox(
    document,
    font,
    data.catalogue,
    "report_discussion_acknowledgement",
    data.report.signatures.report_discussion_acknowledgement,
    MARGIN + signatureWidth,
    signatureTop,
    signatureWidth,
  );
  drawSignatureBox(
    document,
    font,
    data.catalogue,
    "proprietor_or_safety_officer_signature",
    data.report.signatures.proprietor_or_safety_officer_signature,
    MARGIN + signatureWidth * 2,
    signatureTop,
    signatureWidth,
  );
  drawDateLine(
    document,
    font,
    field(data.catalogue, "safety_supervisor_date"),
    data.report.signatures.safety_supervisor_date.value,
    MARGIN,
    signatureTop + 61,
    signatureWidth,
  );
  drawDateLine(
    document,
    font,
    field(data.catalogue, "report_discussion_date"),
    data.report.signatures.report_discussion_date.value,
    MARGIN + signatureWidth,
    signatureTop + 61,
    signatureWidth,
  );
}

function drawSignatureBox(
  document: PDFKit.PDFDocument,
  font: NotoSansHkFont,
  catalogue: FieldCatalogue,
  fieldId: string,
  signature: { value: string | null; extraction_status: string },
  x: number,
  y: number,
  width: number,
): void {
  const definition = field(catalogue, fieldId);
  document.rect(x, y, width, 58).stroke("#7B8B99");
  document
    .font("Helvetica-Bold")
    .fontSize(5.8)
    .fillColor("#172033")
    .text(definition.label_en, x + 5, y + 5, { width: width - 10 });
  font.draw(definition.label_zh, x + 5, y + 16, { size: 5.6, width: width - 10 });
  document
    .font("Helvetica")
    .fontSize(6.2)
    .text(signature.value ?? "", x + 5, y + 31, { width: width - 10 })
    .fontSize(5.2)
    .fillColor(signature.extraction_status === "Needs review" ? "#A12A1F" : "#52606D")
    .text(`Status: ${signature.extraction_status}`, x + 5, y + 45, { width: width - 10 });
}

function drawDateLine(
  document: PDFKit.PDFDocument,
  font: NotoSansHkFont,
  definition: FieldCatalogue["document_fields"][number],
  value: string | null,
  x: number,
  y: number,
  width: number,
): void {
  document
    .font("Helvetica-Bold")
    .fontSize(5.8)
    .fillColor("#172033")
    .text(`${definition.label_en}: ${value ?? ""}`, x + 5, y, { width: width - 10 });
  font.draw(definition.label_zh, x + 5, y + 10, { size: 5.6, width: width - 10 });
}

function drawFooter(
  document: PDFKit.PDFDocument,
  data: ReportRenderData,
  pageNumber: number,
): void {
  document
    .moveTo(MARGIN, PAGE_HEIGHT - 31)
    .lineTo(PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 31)
    .stroke("#7B8B99");
  document
    .font("Helvetica")
    .fontSize(5.6)
    .fillColor("#52606D")
    .text(`SOSS-F3A-${pageNumber} (Rev. 2002) | ${data.fixture.synthetic_data_notice}`, MARGIN, PAGE_HEIGHT - 25, {
      width: TABLE_WIDTH - 80,
    })
    .font("Helvetica-Bold")
    .text(`Page ${pageNumber} of 4`, PAGE_WIDTH - MARGIN - 80, PAGE_HEIGHT - 25, {
      width: 80,
      align: "right",
    });
}

function field(catalogue: FieldCatalogue, fieldId: string) {
  const definition = catalogue.document_fields.find((entry) => entry.field_id === fieldId);
  if (definition === undefined) throw new Error(`Missing catalogue field: ${fieldId}`);
  return definition;
}

function weekDates(startDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  });
}

function fillAndStroke(
  document: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string,
): void {
  document.rect(x, y, width, height).fillAndStroke(fill, stroke);
}

function fitTextSize(
  document: PDFKit.PDFDocument,
  text: string,
  width: number,
  preferred: number,
  minimum: number,
): number {
  for (let size = preferred; size >= minimum; size -= 0.2) {
    if (document.font("Helvetica").fontSize(size).widthOfString(text) <= width) return size;
  }
  return minimum;
}

function ratingColor(rating: DailyRatingValue): string {
  if (rating === "P" || rating === "NO") return "#A12A1F";
  if (rating === "S") return "#8A5A00";
  if (rating === "G" || rating === "YES") return "#1F6B3A";
  return "#52606D";
}

function segmentTextByFont(
  text: string,
  fontForCharacter: (character: string) => string,
): Array<{ font: string; text: string }> {
  const runs: Array<{ font: string; text: string }> = [];
  for (const character of text) {
    const font = fontForCharacter(character);
    const last = runs.at(-1);
    if (last?.font === font) last.text += character;
    else runs.push({ font, text: character });
  }
  return runs;
}

function loadFontChunks(): FontChunk[] {
  const cssPath = path.resolve("node_modules/@fontsource/noto-sans-hk/400.css");
  const css = requireText(cssPath);
  const chunks: FontChunk[] = [];
  const blockPattern = /\/\* noto-sans-hk-\[(\d+)\]-400-normal \*\/[\s\S]*?@font-face\s*\{([\s\S]*?)\}/g;
  for (const match of css.matchAll(blockPattern)) {
    const index = match[1];
    const block = match[2] ?? "";
    const file = block.match(/url\(\.\/files\/([^)]+\.woff)\) format\('woff'\)/)?.[1];
    const unicodeRange = block.match(/unicode-range:\s*([^;]+);/)?.[1];
    if (index === undefined || file === undefined || unicodeRange === undefined) continue;
    chunks.push({
      name: `NotoSansHK-${index}`,
      filePath: path.resolve(path.dirname(cssPath), "files", file),
      ranges: unicodeRange.split(",").map((range) => {
        const [start, end] = range.trim().replace(/^U\+/i, "").split("-");
        const startValue = Number.parseInt(start ?? "", 16);
        return [startValue, Number.parseInt(end ?? start ?? "", 16)];
      }),
    });
  }
  if (chunks.length === 0) throw new Error("Unable to load Noto Sans HK font chunks");
  return chunks;
}

function requireText(filePath: string): string {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(`Required Gate 4C font asset is unavailable: ${filePath}`, { cause: error });
  }
}
