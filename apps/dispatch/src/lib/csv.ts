export type CsvCell = string | number | null | undefined;

/**
 * Semicolon-separated CSV with a UTF-8 BOM: Excel on Azerbaijani/Russian locales opens it with the
 * right columns and letters (spec §14 item 5).
 */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<CsvCell>>): string {
  const escape = (cell: CsvCell): string => {
    const text = cell === null || cell === undefined ? '' : String(cell);
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `\uFEFF${rows.map((row) => row.map(escape).join(';')).join('\r\n')}\r\n`;
}

/** Triggers a browser download of `csv` as `filename`. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
