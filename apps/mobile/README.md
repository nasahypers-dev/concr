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

Everything in Phase 0–1 runs in **Expo Go** (scan the QR code). Maps, background location and push
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
