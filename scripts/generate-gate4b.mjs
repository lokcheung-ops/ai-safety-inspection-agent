import fs from "node:fs/promises";
import path from "node:path";

import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

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
const workbook = Workbook.create();

for (const [sheetIndex, definition] of workbookData.entries()) {
  const sheet = workbook.worksheets.add(definition.name);
  sheet.showGridLines = false;

  const matrix = [definition.headers, ...definition.rows];
  const rowCount = matrix.length;
  const columnCount = definition.headers.length;
  const usedRange = sheet.getRangeByIndexes(0, 0, rowCount, columnCount);
  usedRange.values = matrix;
  usedRange.format.font = { name: "Aptos", size: 10, color: "#1F2937" };
  usedRange.format.verticalAlignment = "center";

  const header = sheet.getRangeByIndexes(0, 0, 1, columnCount);
  header.format.fill = HEADER_FILL;
  header.format.font = { name: "Aptos", size: 10, bold: true, color: HEADER_FONT };
  header.format.rowHeight = 24;
  header.format.wrapText = true;
  header.format.borders = { preset: "outside", style: "medium", color: HEADER_FILL };

  const tableRange = `${columnName(columnCount)}${rowCount}`;
  const table = sheet.tables.add(`A1:${tableRange}`, true, `Gate4BTable${sheetIndex + 1}`);
  table.style = "TableStyleMedium2";
  table.showFilterButton = true;
  sheet.freezePanes.freezeRows(1);

  definition.headers.forEach((column, columnIndex) => {
    const columnRange = sheet.getRangeByIndexes(0, columnIndex, rowCount, 1);
    columnRange.format.columnWidth = columnWidth(column, definition.rows, columnIndex);
    if (definition.dateColumns.includes(column) && rowCount > 1) {
      sheet.getRangeByIndexes(1, columnIndex, rowCount - 1, 1).format.numberFormat = "yyyy-mm-dd";
    }
    if (/recommendation|description|reference|observation_ids|name|address|case_type/.test(column)) {
      columnRange.format.wrapText = true;
    }
  });

  if (rowCount > 1) {
    sheet.getRangeByIndexes(1, 0, rowCount - 1, columnCount).format.borders = {
      insideHorizontal: { style: "hair", color: BORDER_COLOR },
    };
  }
}

await fs.mkdir(path.dirname(NORMALIZED_XLSX_PATH), { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(NORMALIZED_XLSX_PATH);

const previewDir = process.env.GATE4B_PREVIEW_DIR;
if (previewDir) {
  await fs.mkdir(previewDir, { recursive: true });
  for (const definition of workbookData) {
    const preview = await workbook.render({
      sheetName: definition.name,
      range: `A1:${columnName(definition.headers.length)}${Math.min(definition.rows.length + 1, 16)}`,
      scale: 1,
      format: "png",
    });
    await fs.writeFile(
      path.join(previewDir, `${definition.name.replaceAll(" ", "-").toLowerCase()}.png`),
      new Uint8Array(await preview.arrayBuffer()),
    );
  }
}
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

function columnName(columnCount) {
  let value = columnCount;
  let name = "";
  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }
  return name;
}
