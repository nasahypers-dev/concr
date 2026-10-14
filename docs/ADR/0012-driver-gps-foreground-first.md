# 0012. Driver GPS: foreground batches now, background task with the dev build

Date: 2026-10-14
Status: accepted

## Context

Spec §9.1 wants the driver phone to stream GPS while a trip is EN_ROUTE / ARRIVED, including with
the app in the background. Background location needs `expo-task-manager` + a development build
(it does not run in Expo Go, spec §9.6), and the owner tests on Expo Go until Phase 2.

## Decision

- **Now (U2 step 3):** the trip screen (`apps/mobile/src/features/driver/trip-screen.tsx`) tracks in
  the foreground through `useTripTracking`: `expo-location` `watchPositionAsync` (high accuracy,
  `settings.locationUpdateIntervalSec`, 10 m) while the trip is EN_ROUTE / ARRIVED and the screen is
  open; samples are queued in memory and sent as one batch every interval through
  `driver.pushLocations`, which validates them (accuracy ≤ 100 m, time order, dedupe) exactly like
  the future API (spec §9.2). A denied permission shows a banner with a link to Settings; the
  dispatcher sees "no signal" after 2 minutes without samples.
- **Phase 2 (dev build):** the same batch format is produced by a background task
  (`expo-task-manager` + `expo-location` `startLocationUpdatesAsync`) that writes to an MMKV queue;
  the hook on the screen becomes the foreground flush of that queue. Android needs the
  `location` foreground-service type (the `expo-location` config plugin sets it), iOS needs the
  background mode and the dev build; both are listed in `app.config.ts` when the time comes.
- **Status buttons** go through `driver.setStatus` with haptics; COMPLETED is a separate
  `driver.complete` call that carries the handover act (receiver name + photos). Photos come from
  `expo-image-picker` (camera or library, works in Expo Go) and stay local file URIs until the
  upload endpoint exists (Phase B4); the document stores them as `photoUrls`.
- **Concrete timer** is the shared pure `concreteTimer` (`@concr/shared/concrete`): the app ticks it
  per second from `departedAt`, the panel evaluates the same rule for its alerts (D7: 90 minutes,
  warning at 75).
- **Navigation** uses universal links (Apple Maps on iOS, Google Maps, Waze) so no URL-scheme
  whitelist is needed in Expo Go or in the binary (`apps/mobile/src/lib/navigation.ts`).

## Consequences

- Until the dev build, GPS flows only while the driver keeps the trip screen open; the customer map
  still moves because the mock store is shared inside the phone process (and the real API will
  accept the same batches).
- Photos are not uploaded anywhere yet; the act in the mock lists their local URIs.
