# Setup guide (Windows + macOS)

See `README.md` for the full command list. Everything below works the same on both machines; the repo
carries all state (only `.env` files are local and documented in each `.env.example`).

## 1. Prerequisites

| Tool    | Version                        | Windows                                                     | macOS                        |
| ------- | ------------------------------ | ----------------------------------------------------------- | ---------------------------- |
| Node.js | 24 (see `.nvmrc`)              | nodejs.org installer or `nvm-windows`                       | `nvm install 24` or Homebrew |
| npm     | 10+                            | comes with Node                                             | comes with Node              |
| Git     | any recent                     | Git for Windows (run `git config core.longpaths true` once) | Xcode CLT / Homebrew         |
| Docker  | Docker Desktop (WSL 2 backend) | docker.com → install, enable WSL 2 integration              | Docker Desktop or OrbStack   |
| Expo Go | SDK 57                         | Play Store on the phone                                     | App Store on the phone       |

Docker is only needed for the database and Redis. Without it the API still starts and `/health` answers 200,
but `/health/ready` reports 503 and migrations cannot run. On Windows, Docker Desktop needs WSL 2: run
`wsl --install` in an **administrator** PowerShell, reboot, then open Docker Desktop and wait for
"Engine running". Not needed for the mock-mode UI sprints.

## 2. First run on a fresh machine

```
git clone <repo-url> concr
cd concr
npm install                # also runs `prisma generate` for the API
npm run docker:up          # PostGIS + Redis in the background
# copy the env examples (Windows: copy, macOS: cp)
copy apps\api\.env.example apps\api\.env
copy apps\mobile\.env.example apps\mobile\.env
copy apps\dispatch\.env.example apps\dispatch\.env
npm run db:migrate         # applies prisma/migrations (asks for a name only when the schema changed)
npm run dev                # API on :3000, dispatcher panel on :3001
```

Check: http://localhost:3000/api/v1/health/ready should show `database` and `redis` as `up`, and
http://localhost:3001/login should render the Azerbaijani login form.

## 3. Mobile

```
npm run dev:mobile         # Expo dev server; scan the QR code with Expo Go
```

The phone talks to your laptop over Wi-Fi, so `localhost` does not work from the phone. Put the laptop LAN IP
into `apps/mobile/.env` as `EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api/v1`. Find the IP with `ipconfig`
(Windows) or `ipconfig getifaddr en0` (macOS). On Windows allow Node through the firewall on **private**
networks when prompted. Restart `npm run dev:mobile` after changing `.env`.

The app runs in **mock mode** by default (`EXPO_PUBLIC_API_MODE=mock` in `apps/mobile/.env.example`):
all data comes from `@concr/shared` fixtures, no API or Docker is needed. Sign in with any phone and the
code `123456`; in development the welcome screen also has a "DEV: sign in as the test customer" button that
opens the seeded account with six orders (one with a mixer moving on the live map). The LAN IP setting above
only matters once `EXPO_PUBLIC_API_MODE=http` is used (Phase B2).

Health check for the mobile toolchain: `cd apps/mobile && npx expo-doctor`.

### Expo Go vs development build

Expo Go is a ready-made app from the store that runs our JavaScript. It only contains the native modules Expo
ships, which is enough for Phase 0 and Phase 1. Maps, background GPS and push notifications (Phase 2) need
native modules that are not in Expo Go, so from then on we build our own app binary once with
`eas build --profile development` and install it on the phone. The README will say when that becomes necessary.

## 4. Quality gates (before every commit)

```
npm run lint && npm run typecheck && npm run test
```

CI (`.github/workflows/ci.yml`) runs the same plus migrations, a schema-drift check, the API e2e suite against
real PostGIS/Redis containers, and both builds.

## 5. Publishing the repo (one-time)

Create an empty private GitHub repository, then:

```
git remote add origin git@github.com:<you>/concr.git
git push -u origin main
```

Afterwards, when switching computers: `git pull` first, `git push` before leaving.
