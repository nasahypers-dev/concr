import { isNearResult, nominatimToAddress, reverseGeocodeLocalized } from './reverse-geocode';

const point = { lat: 40.3905, lng: 49.811 };

const respond = (...bodies: unknown[]) => {
  const queue = [...bodies];
  return jest.fn(() => {
    const body = queue.shift();
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as unknown as Response);
  });
};

describe('nominatimToAddress', () => {
  it('shows street, number, the specific locality and the city, never the rayon', () => {
    expect(
      nominatimToAddress({
        road: 'Əhməd Rəcəbli küçəsi',
        house_number: '12',
        suburb: 'Yasamal',
        city_district: 'Yasamal rayonu',
        city: 'Bakı',
      }),
    ).toEqual({ text: 'Əhməd Rəcəbli küçəsi 12, Yasamal, Bakı', streetKnown: true });
    expect(
      nominatimToAddress({
        road: 'Rauf Kazımovski küçəsi',
        village: 'Bilgəh',
        city_district: 'Sabunçu rayonu',
        city: 'Bakı',
      }),
    ).toEqual({ text: 'Rauf Kazımovski küçəsi, Bilgəh, Bakı', streetKnown: true });
  });

  it('keeps the locality when the street is dropped and drops repeats', () => {
    expect(
      nominatimToAddress(
        { road: 'Uzaq küçə', village: 'Bilgəh', city_district: 'Sabunçu rayonu', city: 'Bakı' },
        false,
      ),
    ).toEqual({ text: 'Bilgəh, Bakı', streetKnown: false });
    expect(nominatimToAddress({})).toBeNull();
    expect(nominatimToAddress({ road: 'Sülh küçəsi', suburb: 'Bakı', city: 'bakı' })).toEqual({
      text: 'Sülh küçəsi, Bakı',
      streetKnown: true,
    });
  });
});

describe('isNearResult', () => {
  it('accepts a point inside or just outside the matched bounding box', () => {
    const box: [string, string, string, string] = ['40.3900', '40.3910', '49.8100', '49.8120'];
    expect(isNearResult(point, { boundingbox: box })).toBe(true);
    expect(isNearResult({ lat: 40.395, lng: 49.811 }, { boundingbox: box })).toBe(false);
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
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('nominatim.openstreetmap.org/reverse');
    expect(url).toContain('lat=40.390500');
    expect(url).toContain('zoom=18');
    expect((init.headers as Record<string, string>)['Accept-Language']).toMatch(/^az,/);
  });

  it('falls back to the street-level lookup when the building carries no nearby street', async () => {
    const fetchImpl = respond(
      {
        boundingbox: ['40.4200', '40.4210', '49.8400', '49.8420'], // ~3 km away: dropped
        address: { road: 'Uzaq küçə', village: 'Bilgəh', city: 'Bakı' },
      },
      {
        boundingbox: ['40.3900', '40.3910', '49.8100', '49.8120'],
        address: { road: 'Rauf Kazımovski küçəsi', village: 'Bilgəh', city: 'Bakı' },
      },
    );
    await expect(reverseGeocodeLocalized(point, 'az', fetchImpl)).resolves.toEqual({
      text: 'Rauf Kazımovski küçəsi, Bilgəh, Bakı',
      streetKnown: true,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect((fetchImpl.mock.calls[1] as unknown as [string])[0]).toContain('zoom=17');
  });

  it('keeps the locality alone when no street is near at either zoom', async () => {
    const far = {
      boundingbox: ['40.4200', '40.4210', '49.8400', '49.8420'],
      address: { road: 'Uzaq küçə', village: 'Bilgəh', city: 'Bakı' },
    };
    await expect(reverseGeocodeLocalized(point, 'az', respond(far, far))).resolves.toEqual({
      text: 'Bilgəh, Bakı',
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
