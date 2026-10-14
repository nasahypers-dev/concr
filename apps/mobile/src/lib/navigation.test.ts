import { navigationLinks } from './navigation';

const site = { lat: 40.3905, lng: 49.811 };

describe('navigationLinks', () => {
  it('offers Apple Maps first on iOS, then Google Maps and Waze', () => {
    const links = navigationLinks(site, 'ios');
    expect(links.map((l) => l.app)).toEqual(['apple', 'google', 'waze']);
    expect(links[0]?.url).toBe('http://maps.apple.com/?daddr=40.3905,49.811&dirflg=d');
    expect(links[1]?.url).toContain('destination=40.3905,49.811');
    expect(links[2]?.url).toBe('https://waze.com/ul?ll=40.3905,49.811&navigate=yes');
  });

  it('skips Apple Maps on Android', () => {
    expect(navigationLinks(site, 'android').map((l) => l.app)).toEqual(['google', 'waze']);
  });
});
