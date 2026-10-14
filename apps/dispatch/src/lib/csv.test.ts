import { toCsv } from './csv';

describe('toCsv', () => {
  it('writes a BOM, semicolons and escapes quotes and separators', () => {
    const csv = toCsv([
      ['Nömrə', 'Müştəri', 'Məbləğ'],
      ['CN-2026-000101', 'Orxan; "Usta"', 1558],
      ['CN-2026-000102', null, undefined],
    ]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('Nömrə;Müştəri;Məbləğ\r\n');
    expect(csv).toContain('CN-2026-000101;"Orxan; ""Usta""";1558\r\n');
    expect(csv.endsWith('CN-2026-000102;;\r\n')).toBe(true);
  });
});
