# 0008. Maps without a Google key for now

Date: 2026-10-09
Status: accepted

## Context

Spec §6 targets Google Maps (mobile and web) and Google Routes for ETA. Those need a Google Maps
Platform billing account, which the owner prefers to set up later (`docs/DECISIONS.md` Q9).

## Decision

- Mobile: `react-native-maps` through the `MapView` wrapper in `apps/mobile/src/ui/map-view.tsx`.
  It works in Expo Go on both platforms (Apple Maps on iOS; on Android Expo Go ships its own
  Google key). The wrapper exposes plant/site/truck markers and a route polyline; truck markers
  rotate with the heading.
- Web (Sprint U3): MapLibre GL with OpenFreeMap tiles, no key, behind one component.
- ETA in mock mode: remaining route length / average speed (the spec's haversine fallback).
- When the key exists: web switches to `@vis.gl/react-google-maps` inside the same component;
  the API gets Google Routes for ETA and route geometry; mobile keeps `react-native-maps` and only
  adds the key to `app.config.ts` for the development build.

## Consequences

- Nothing in the screens knows which map provider renders.
- Until the dev build, mobile maps are only verifiable on a real device through Expo Go
  (Jest uses the manual mock in `apps/mobile/__mocks__/react-native-maps.tsx`).
