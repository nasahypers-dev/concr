import type { GeoPoint } from '@concr/shared';
import { Platform } from 'react-native';

export type NavigationApp = 'apple' | 'google' | 'waze';

export interface NavigationLink {
  app: NavigationApp;
  url: string;
}

/**
 * Turn-by-turn links to a site (spec §13 "naviqasiya"). Universal URLs on purpose: they open the
 * installed app or fall back to the browser, and need no URL-scheme whitelist in the binary, so
 * they work in Expo Go today and in the dev build later.
 */
export function navigationLinks(
  to: GeoPoint,
  platform: typeof Platform.OS = Platform.OS,
): NavigationLink[] {
  const point = `${to.lat},${to.lng}`;
  const links: NavigationLink[] = [];
  if (platform === 'ios') {
    links.push({ app: 'apple', url: `http://maps.apple.com/?daddr=${point}&dirflg=d` });
  }
  links.push({
    app: 'google',
    url: `https://www.google.com/maps/dir/?api=1&destination=${point}&travelmode=driving`,
  });
  links.push({ app: 'waze', url: `https://waze.com/ul?ll=${point}&navigate=yes` });
  return links;
}
