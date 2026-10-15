import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';

export type PdfCell = string | number;

export interface PdfTable {
  title?: string;
  columns: string[];
  rows: PdfCell[][];
  /** pdfmake column widths; defaults to equal stretch. */
  widths?: ('*' | 'auto' | number)[];
}

export interface PdfDocumentInput {
  title: string;
  subtitle?: string;
  tables: PdfTable[];
  landscape?: boolean;
  /** Printed on every page next to the page number. */
  footer?: string;
}

const GRAPHITE = '#12161F';
const MUTED = '#6B7280';

/**
 * Pure document definition for pdfmake (tested without a browser): a title, an optional
 * subtitle and one or more tables with a shaded header row. Roboto (bundled with pdfmake)
 * covers the Azerbaijani and Russian alphabets.
 */
export function tablePdfDefinition(input: PdfDocumentInput): TDocumentDefinitions {
  const content: Content[] = [{ text: input.title, style: 'title' }];
  if (input.subtitle) content.push({ text: input.subtitle, style: 'subtitle' });
  for (const table of input.tables) {
    if (table.title) content.push({ text: table.title, style: 'section' });
    const header: TableCell[] = table.columns.map((column) => ({ text: column, style: 'th' }));
    const body: TableCell[][] = table.rows.map((row) =>
      row.map((cell): TableCell => ({ text: String(cell) })),
    );
    content.push({
      table: {
        headerRows: 1,
        widths: table.widths ?? table.columns.map(() => '*'),
        body: [header, ...body],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 14],
    });
  }
  const footer = input.footer;
  return {
    pageSize: 'A4',
    pageOrientation: input.landscape ? 'landscape' : 'portrait',
    pageMargins: [32, 36, 32, 40],
    info: { title: input.title },
    content,
    footer: footer
      ? (currentPage, pageCount) => ({
          text: `${footer} · ${currentPage}/${pageCount}`,
          style: 'footer',
          margin: [32, 10, 32, 0],
        })
      : undefined,
    defaultStyle: { fontSize: 9, color: GRAPHITE },
    styles: {
      title: { fontSize: 16, bold: true, margin: [0, 0, 0, 4] },
      subtitle: { fontSize: 10, color: MUTED, margin: [0, 0, 0, 12] },
      section: { fontSize: 11, bold: true, margin: [0, 6, 0, 6] },
      th: { bold: true, fillColor: '#F3F4F6' },
      footer: { fontSize: 8, color: MUTED },
    },
  };
}

/** Builds the PDF in the browser and triggers a download; pdfmake is loaded on first use. */
export async function downloadPdf(
  filename: string,
  definition: TDocumentDefinitions,
): Promise<void> {
  const [pdfModule, fontsModule] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ]);
  pdfModule.addVirtualFileSystem(fontsModule.default);
  // download() returns a promise in recent builds; a failed download is reported by the browser.
  void pdfModule.createPdf(definition).download(filename);
}
