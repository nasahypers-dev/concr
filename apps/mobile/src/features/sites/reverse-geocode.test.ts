import { nominatimToAddress, reverseGeocodeLocalized } from './reverse-geocode';

const point = { lat: 40.3905, lng: 49.811 };

describe('nominatimToAddress', () => {
  it('joins street, number, district and city in the response language', () => {
    expect(
      nominatimToAddress({
        road: 'Əhməd Rəcəbli küçəsi',
        house_number: '12',
        suburb: 'Yasamal',
        city_district: 'Yasamal rayonu',
        city: 'Bakı',
      }),
    ).toBe('Əhməd Rəcəbli küçəsi 12, Yasamal rayonu, Bakı');
  });

  it('needs at least a street and drops repeats', () => {
    expect(nominatimToAddress({ suburb: 'Yasamal', city: 'Bakı' })).toBeNull();
    expect(nominatimToAddress({ road: 'Sülh küçəsi', district: 'Bakı', city: 'bakı' })).toBe(
      'Sülh küçəsi, Bakı',
    );
  });
});

describe('reverseGeocodeLocalized', () => {
  it('asks Nominatim in the app language and formats the answer', async () => {
    const fetchImpl = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            address: { road: 'Bağlar küçəsi', house_number: '7', suburb: 'Mərdəkan', city: 'Bakı' },
          }),
      } as unknown as Response),
    );
    await expect(reverseGeocodeLocalized(point, 'az', fetchImpl)).resolves.toBe(
      'Bağlar küçəsi 7, Mərdəkan, Bakı',
    );
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('nominatim.openstreetmap.org/reverse');
    expect(url).toContain('lat=40.390500');
    expect((init.headers as Record<string, string>)['Accept-Language']).toMatch(/^az,/);
  });

  it('returns null on network failures and bad responses', async () => {
    await expect(
      reverseGeocodeLocalized(point, 'az', () => Promise.reject(new Error('offline'))),
    ).resolves.toBeNull();
    await expect(
      reverseGeocodeLocalized(point, 'az', () =>
        Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as unknown as Response),
      ),
    ).resolves.toBeNull();
  });
});
