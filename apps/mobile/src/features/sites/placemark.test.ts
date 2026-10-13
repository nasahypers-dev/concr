import { placemarkToAddress } from './placemark';

describe('placemarkToAddress', () => {
  it('joins street, number, district and city', () => {
    expect(
      placemarkToAddress({
        street: 'Əhməd Rəcəbli',
        streetNumber: '12',
        name: '12 Əhməd Rəcəbli',
        district: 'Yasamal',
        subregion: null,
        city: 'Bakı',
      }),
    ).toBe('Əhməd Rəcəbli 12, Yasamal, Bakı');
  });

  it('falls back to the placemark name and the subregion', () => {
    expect(
      placemarkToAddress({
        street: null,
        streetNumber: null,
        name: 'Bağlar küç.',
        district: null,
        subregion: 'Xəzər',
        city: 'Bakı',
      }),
    ).toBe('Bağlar küç., Xəzər, Bakı');
  });

  it('skips an administrative city as well', () => {
    expect(
      placemarkToAddress({
        street: 'Hüseyn Cavid küçəsi',
        streetNumber: null,
        name: null,
        district: 'Bilgəh',
        subregion: null,
        city: 'Sabunçu rayonu',
      }),
    ).toBe('Hüseyn Cavid küçəsi, Bilgəh');
  });

  it('skips an administrative subregion', () => {
    expect(
      placemarkToAddress({
        street: 'Rauf Kazımovski küçəsi',
        streetNumber: null,
        name: null,
        district: 'Bilgəh',
        subregion: 'Sabunçu rayonu',
        city: 'Bakı',
      }),
    ).toBe('Rauf Kazımovski küçəsi, Bilgəh, Bakı');
    expect(
      placemarkToAddress({
        street: 'Rauf Kazımovski küçəsi',
        streetNumber: null,
        name: null,
        district: null,
        subregion: 'Sabunçu rayonu',
        city: 'Bakı',
      }),
    ).toBe('Rauf Kazımovski küçəsi, Bakı');
  });

  it('drops repeated parts and returns null for an empty placemark', () => {
    expect(
      placemarkToAddress({
        street: 'Sülh',
        streetNumber: null,
        name: null,
        district: 'Bakı',
        subregion: null,
        city: 'bakı',
      }),
    ).toBe('Sülh, Bakı');
    expect(
      placemarkToAddress({
        street: null,
        streetNumber: null,
        name: null,
        district: null,
        subregion: null,
        city: null,
      }),
    ).toBeNull();
  });
});
