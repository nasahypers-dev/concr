import { tablePdfDefinition } from './pdf';

describe('tablePdfDefinition', () => {
  it('lays out the title, subtitle and shaded table headers with Azerbaijani text intact', () => {
    const definition = tablePdfDefinition({
      title: 'Sifarişlər',
      subtitle: '01.10.2026 – 15.10.2026',
      landscape: true,
      footer: 'CONCR',
      tables: [
        {
          title: 'Günlər üzrə',
          columns: ['Nömrə', 'Müştəri', 'Məbləğ'],
          rows: [['CN-2026-000101', 'Orxan Məmmədli', '1 557,60 ₼']],
          widths: ['auto', '*', 'auto'],
        },
      ],
    });
    expect(definition.pageOrientation).toBe('landscape');
    const content = definition.content as unknown as Array<Record<string, unknown>>;
    expect(content[0]).toEqual({ text: 'Sifarişlər', style: 'title' });
    expect(content[1]).toEqual({ text: '01.10.2026 – 15.10.2026', style: 'subtitle' });
    expect(content[2]).toEqual({ text: 'Günlər üzrə', style: 'section' });
    const table = content[3]?.table as { headerRows: number; widths: string[]; body: unknown[][] };
    expect(table.headerRows).toBe(1);
    expect(table.widths).toEqual(['auto', '*', 'auto']);
    expect(table.body[0]).toEqual([
      { text: 'Nömrə', style: 'th' },
      { text: 'Müştəri', style: 'th' },
      { text: 'Məbləğ', style: 'th' },
    ]);
    expect(table.body[1]).toEqual([
      { text: 'CN-2026-000101' },
      { text: 'Orxan Məmmədli' },
      { text: '1 557,60 ₼' },
    ]);
    expect(typeof definition.footer).toBe('function');
  });
});
