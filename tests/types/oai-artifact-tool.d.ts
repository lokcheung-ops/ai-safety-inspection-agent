declare module "@oai/artifact-tool" {
  interface Range {
    values: unknown[][];
    format: { numberFormat: string };
  }

  interface Worksheet {
    name: string;
    getRange(address: string): Range;
    tables: { items: Array<{ showFilterButton: boolean }> };
  }

  interface Workbook {
    worksheets: {
      getItem(name: string): Worksheet;
      getItemAt(index: number): Worksheet;
    };
  }

  export const FileBlob: {
    load(path: string): Promise<unknown>;
  };

  export const SpreadsheetFile: {
    importXlsx(blob: unknown): Promise<Workbook>;
  };
}
