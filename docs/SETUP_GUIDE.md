# Setup guide (Windows + macOS)

See `README.md` for the full command list.

## Prerequisites

| Tool    | Version                       | Windows                               | macOS                        |
| ------- | ----------------------------- | ------------------------------------- | ---------------------------- |
| Node.js | 24 (see `.nvmrc`)             | nodejs.org installer or `nvm-windows` | `nvm install 24` or Homebrew |
| npm     | 10+                           | comes with Node                       | comes with Node              |
| Docker  | Docker Desktop (WSL2 backend) | docker.com                            | Docker Desktop or OrbStack   |
| Expo Go | SDK 57                        | Play Store on the phone               | App Store on the phone       |
| Git     | any recent                    | Git for Windows                       | Xcode CLT / Homebrew         |

## First run

```
git clone <repo-url> concr
cd concr
npm install
npm run docker:up          # PostGIS + Redis in the background
# copy the env examples (Windows: copy, macOS: cp)
copy apps\api\.env.example apps\api\.env
copy apps\mobile\.env.example apps\mobile\.env
copy apps\dispatch\.env.example apps\dispatch\.env
npm run db:migrate
npm run dev                # API on :3000, dispatcher panel on :3001
npm run dev:mobile         # Expo dev server; scan the QR code with Expo Go
```

## Phone cannot reach the API?

The phone talks to your laptop over Wi-Fi, so `localhost` does not work from the phone. Put the laptop LAN IP
into `apps/mobile/.env` as `EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api/v1`. Find the IP with `ipconfig`
(Windows) or `ipconfig getifaddr en0` (macOS). On Windows allow Node through the firewall on **private**
networks when prompted. Restart `npm run dev:mobile` after changing `.env`.

## Expo Go vs development build

Expo Go is a ready-made app from the store that runs our JavaScript. It only contains the native modules Expo
ships, which is enough for Phase 0 and Phase 1. Maps, background GPS and push notifications (Phase 2) need
native modules that are not in Expo Go, so from then on we build our own app binary with
`eas build --profile development`. The README will say when that becomes necessary.
