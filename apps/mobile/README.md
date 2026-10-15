# @concr/mobile

Expo SDK 57 · Expo Router · NativeWind 4 · TanStack Query · Zustand · i18next. One app, two roles:
`app/(customer)` and `app/(driver)`, chosen by the session role in `app/_layout.tsx`.

```
npm run dev:mobile          # from the repo root (builds @concr/shared first), or `npm start` here
npm run typecheck && npm run lint && npm test
npx expo-doctor             # dependency / config sanity check
```

Copy `.env.example` to `.env` and put your laptop's LAN IP in `EXPO_PUBLIC_API_URL`.

## Expo Go vs development build

Everything in Phase 0–1 runs in **Expo Go** (scan the QR code), including `react-native-maps` and the
foreground `expo-location` fix behind "use my location" in the site picker. Background location and push
notifications (Phase 2) need native modules that Expo Go does not contain; from then on build a
development client once with `eas build --profile development` and install it on the phone.

## Layout

```
app/            routes only (file = screen, _layout.tsx = navigator)
src/ui/         Button, TextField, Screen, StateView + design tokens
src/i18n/       i18next bootstrap over @concr/shared bundles (az/ru/en)
src/store/      zustand session store persisted in expo-secure-store
src/api/        fetch wrapper that understands the API error envelope, QueryClient
src/features/   feature hooks (Phase 1+)
```

## First-run tour and language

The home screen shows a three-step guided tour once per install (order button, Orders tab, Sites tab) with a
Skip button; the flag lives in the settings store. The profile has an "App walkthrough" row that replays it. The UI
starts in Azerbaijani regardless of the phone's language; the language picked in the profile persists (D19).

## Driver mode

Drivers never self-register and never use the OTP: the supplier creates them in the panel and they sign in
with "Sürücü girişi" on the welcome screen using their phone (or e-mail) and the password the admin set (D22,
amended 2026-10-15). Seeded drivers (password `Surucu123!`): Rauf `+994500000012` (mixer
90-TR-631, one completed and one upcoming trip today), Elşən `+994500000011` (the trip the customer app tracks
live, plus one tomorrow), Kamran `+994500000013` (off shift, nothing today).

"Today" shows the shift switch with the assigned mixer, today's trips and a preview of tomorrow; the profile has
the mixer, the shift switch, language, appearance and "call the dispatcher". The trip screen walks the trip with
one big button per status (loading → departed → arrived → unloading → complete), shows the concrete timer from
departure (warning at 75 min, expired at 90), offers the site contact, navigation links (Apple Maps / Google Maps /
Waze), a "problem" path (FAILED with a reason) and the handover act at the end (receiver name + up to 3 photos from
the camera or the library). While a trip is en route the screen sends GPS batches in the foreground (ADR 0012);
background tracking needs the development build. Driver screens live in `src/features/driver/`.
