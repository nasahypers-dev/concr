import { dedupeParts, isAdministrativeArea, pickLocality } from './address-parts';

describe('address-parts', () => {
  it('recognises administrative units in az, ru and en', () => {
    expect(isAdministrativeArea('Sabunçu rayonu')).toBe(true);
    expect(isAdministrativeArea('Yasamal rayon')).toBe(true);
    expect(isAdministrativeArea('Сабунчинский район')).toBe(true);
    expect(isAdministrativeArea('Sabunchu District')).toBe(true);
    expect(isAdministrativeArea('Bilgəh')).toBe(false);
    expect(isAdministrativeArea('Yasamal')).toBe(false);
  });

  it('picks the first specific locality and skips the rayon', () => {
    expect(pickLocality(['Sabunçu rayonu', 'Bilgəh'])).toBe('Bilgəh');
    expect(pickLocality([null, '', 'Mərdəkan'])).toBe('Mərdəkan');
    expect(pickLocality(['Sabunçu rayonu'])).toBe('');
  });

  it('dedupes parts case-insensitively', () => {
    expect(dedupeParts(['Bakı', ' bakı ', '', 'Bilgəh'])).toEqual(['Bakı', 'Bilgəh']);
  });
});
