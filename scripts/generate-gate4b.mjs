import fs from "node:fs/promises";
import path from "node:path";

import ExcelJS from "exceljs";
import { unzipSync, zipSync } from "fflate";

import { loadFieldCatalogue } from "../src/form3a/catalogue.ts";
import { loadCanonicalFixture } from "../src/form3a/fixture.ts";
import { loadNormalizedData } from "../src/form3a/normalized.ts";
import {
  NORMALIZED_XLSX_PATH,
  deriveGate4bWorkbookData,
} from "../src/form3a/xlsx-data.ts";

const HEADER_FILL = "#1F4E78";
const HEADER_FONT = "#FFFFFF";
const BORDER_COLOR = "#D9E2F3";

const workbookData = deriveGate4bWorkbookData(
  loadCanonicalFixture(),
  loadNormalizedData(),
  loadFieldCatalogue(),
);
const workbook = new ExcelJS.Workbook();
const workbookTimestamp = new Date("2026-01-01T00:00:00.000Z");
workbook.creator = "Safety Inspection Report Review Assistant";
workbook.lastModifiedBy = "Safety Inspection Report Review Assistant";
workbook.created = workbookTimestamp;
workbook.modified = workbookTimestamp;

for (const [sheetIndex, definition] of workbookData.entries()) {
  const sheet = workbook.addWorksheet(definition.name, {
    views: [{ state: "frozen", ySplit: 1, topLeftCell: "A2", showGridLines: false }],
  });
  const rowCount = definition.rows.length + 1;
  const columnCount = definition.headers.length;
  sheet.addTable({
    name: `Gate4BTable${sheetIndex + 1}`,
    ref: "A1",
    headerRow: true,
    totalsRow: false,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: definition.headers.map((name) => ({ name })),
    rows: definition.rows,
  });

  sheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: "Aptos", size: 10, color: { argb: "FF1F2937" } };
      cell.alignment = { vertical: "middle" };
    });
  });

  const header = sheet.getRow(1);
  header.height = 24;
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${HEADER_FILL.slice(1)}` } };
    cell.font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: `FF${HEADER_FONT.slice(1)}` },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "medium", color: { argb: `FF${HEADER_FILL.slice(1)}` } },
      left: { style: "medium", color: { argb: `FF${HEADER_FILL.slice(1)}` } },
      bottom: { style: "medium", color: { argb: `FF${HEADER_FILL.slice(1)}` } },
      right: { style: "medium", color: { argb: `FF${HEADER_FILL.slice(1)}` } },
    };
  });

  definition.headers.forEach((column, columnIndex) => {
    const worksheetColumn = sheet.getColumn(columnIndex + 1);
    worksheetColumn.width = columnWidth(column, definition.rows, columnIndex);
    if (definition.dateColumns.includes(column) && rowCount > 1) {
      for (let rowIndex = 2; rowIndex <= rowCount; rowIndex += 1) {
        sheet.getCell(rowIndex, columnIndex + 1).numFmt = "yyyy-mm-dd";
      }
    }
    if (/recommendation|description|reference|observation_ids|name|address|case_type/.test(column)) {
      worksheetColumn.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { ...cell.alignment, wrapText: true };
      });
    }
  });

  if (rowCount > 1) {
    for (let rowIndex = 2; rowIndex <= rowCount; rowIndex += 1) {
      sheet.getRow(rowIndex).eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          ...cell.border,
          bottom: { style: "hair", color: { argb: `FF${BORDER_COLOR.slice(1)}` } },
        };
      });
    }
  }
}

await fs.mkdir(path.dirname(NORMALIZED_XLSX_PATH), { recursive: true });
await workbook.xlsx.writeFile(NORMALIZED_XLSX_PATH);
const workbookArchive = unzipSync(new Uint8Array(await fs.readFile(NORMALIZED_XLSX_PATH)));
await fs.writeFile(
  NORMALIZED_XLSX_PATH,
  zipSync(workbookArchive, { level: 6, mtime: workbookTimestamp }),
);
await fs.rm(`${NORMALIZED_XLSX_PATH}.inspect.ndjson`, { force: true });

function columnWidth(header, rows, columnIndex) {
  const sampled = rows.slice(0, 200).map((row) => row[columnIndex]);
  const contentWidth = Math.max(
    header.length,
    ...sampled.map((value) =>
      value instanceof Date ? 10 : String(value ?? "").split("\n")[0].length,
    ),
  );
  const cap = /recommendation|description|reference|observation_ids/.test(header)
    ? 55
    : /_ids?$/.test(header)
      ? 48
      : /name|address|case_type/.test(header)
        ? 42
        : 32;
  return Math.min(Math.max(contentWidth + 2, 11), cap);
}
