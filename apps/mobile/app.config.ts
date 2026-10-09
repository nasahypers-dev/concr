import type { ConfigContext, ExpoConfig } from 'expo/config';

// TODO(nurlan): brand identifiers. "CONCR" is a temporary name (spec §20.8). The slug, scheme,
// bundle identifier and Android package are painful to change after the first store build.
const APP_NAME = 'CONCR';
const SLUG = 'concr';
const SCHEME = 'concr';
const BUNDLE_ID = 'az.concr.app';

// Design tokens (spec §13): primary graphite from novxanibeton.az theme-color.
const PRIMARY = '#12161F';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: SLUG,
  version: '0.1.0',
  orientation: 'portrait',
  scheme: SCHEME,
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  // New Architecture is always on in SDK 57 (no flag). Splash screen is configured through the
  // expo-splash-screen config plugin once the dev build arrives (Phase 2); Expo Go uses its own.
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: PRIMARY,
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-localization',
    'expo-secure-store',
    [
      'expo-location',
      {
        // Foreground only: the site picker's "use my location". Driver background tracking
        // (spec §9) adds `isAndroidBackgroundLocationEnabled` with the dev build in Phase 2.
        locationWhenInUsePermission:
          'CONCR uses your location to place the concrete pour spot on the map.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    // Filled by EAS in Phase 2 (eas init); keep the key so app.config stays stable.
    eas: {},
  },
});
