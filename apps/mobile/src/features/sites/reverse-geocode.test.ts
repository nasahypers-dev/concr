import { isNearResult, nominatimToAddress, reverseGeocodeLocalized } from './reverse-geocode';

const point = { lat: 40.3905, lng: 49.811 };

const respond = (body: unknown) =>
  jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as unknown as Response),
  );

describe('nominatimToAddress', () => {
  it('joins street, number, settlement, district and city in the response language', () => {
    expect(
      nominatimToAddress({
        road: 'Əhməd Rəcəbli küçəsi',
        house_number: '12',
        suburb: 'Yasamal',
        city_district: 'Yasamal rayonu',
        city: 'Bakı',
      }),
    ).toEqual({
      text: 'Əhməd Rəcəbli küçəsi 12, Yasamal, Yasamal rayonu, Bakı',
      streetKnown: true,
    });
  });

  it('keeps the settlement and the district when the street is dropped', () => {
    expect(
      nominatimToAddress(
        {
          road: 'Rauf Kazımovski küçəsi',
          village: 'Bilgəh',
          city_district: 'Sabunçu rayonu',
          city: 'Bakı',
        },
        false,
      ),
    ).toEqual({ text: 'Bilgəh, Sabunçu rayonu, Bakı', streetKnown: false });
    expect(nominatimToAddress({})).toBeNull();
    expect(nominatimToAddress({ road: 'Sülh küçəsi', district: 'Bakı', city: 'bakı' })).toEqual({
      text: 'Sülh küçəsi, Bakı',
      streetKnown: true,
    });
  });
});

describe('isNearResult', () => {
  it('accepts a point inside or just outside the matched bounding box', () => {
    const box = { boundingbox: ['40.3900', '40.3910', '49.8100', '49.8120'] as const };
    expect(isNearResult(point, { boundingbox: [...box.boundingbox] })).toBe(true);
    expect(isNearResult({ lat: 40.395, lng: 49.811 }, { boundingbox: [...box.boundingbox] })).toBe(
      false,
    );
    expect(isNearResult(point, {})).toBe(true);
  });
});

describe('reverseGeocodeLocalized', () => {
  it('asks Nominatim in the app language and formats the answer', async () => {
    const fetchImpl = respond({
      boundingbox: ['40.3900', '40.3910', '49.8100', '49.8120'],
      address: { road: 'Bağlar küçəsi', house_number: '7', suburb: 'Mərdəkan', city: 'Bakı' },
    });
    await expect(reverseGeocodeLocalized(point, 'az', fetchImpl)).resolves.toEqual({
      text: 'Bağlar küçəsi 7, Mərdəkan, Bakı',
      streetKnown: true,
    });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('nominatim.openstreetmap.org/reverse');
    expect(url).toContain('lat=40.390500');
    expect((init.headers as Record<string, string>)['Accept-Language']).toMatch(/^az,/);
  });

  it('drops a street that lies far from the chosen point (outskirts)', async () => {
    const fetchImpl = respond({
      boundingbox: ['40.4200', '40.4210', '49.8400', '49.8420'], // ~3 km away
      address: {
        road: 'Rauf Kazımovski küçəsi',
        village: 'Bilgəh',
        city_district: 'Sabunçu rayonu',
        city: 'Bakı',
      },
    });
    await expect(reverseGeocodeLocalized(point, 'az', fetchImpl)).resolves.toEqual({
      text: 'Bilgəh, Sabunçu rayonu, Bakı',
      streetKnown: false,
    });
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
